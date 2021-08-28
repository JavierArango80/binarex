/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable max-len */
import { UtilitiesService } from './../../services/utilities.service';
import { Bank } from './../../interfaces/bank';
import { AlertsService } from './../../services/alerts.service';
import { UserBanksComponent } from './../user-banks/user-banks.component';
import { ModalController } from '@ionic/angular';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { usdtPrice, FirestoreService } from '../../services/firestore.service';
import { Transaction } from '../../interfaces/transaction';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss'],
})
export class WithdrawComponent implements OnInit, OnDestroy {

  fullUser: User;
  public subscriptionUser: Subscription;
  public subscriptionBanksUser: Subscription;
  public subscriptionHttp: Subscription;
  usdt: Observable<usdtPrice>;
  transaction: Transaction;
  variables;
  paymentMethods: string[];
  banks: string[];
  bank: Bank;
  ready = false;
  bankNickName: string;

  constructor(
    private modalController: ModalController,
    private fire: FirestoreService,
    private alerts: AlertsService,
    private utilities: UtilitiesService
  ) {
    this.usdt =  this.fire.getUsdtObservable();
   }

  async ngOnInit() {
    this.variables = await this.fire.getVariables();
    this.paymentMethods = this.variables.paymentMethods.filter(obj => {
      if (obj === 'Transferencia' || obj === 'Efectivo') {
        return obj;
      }
    });
    this.transaction = {
      paymentMethod: this.variables.paymentMethods[0],
      cop: null
    };
    if (!this.subscriptionUser) {
      this.subscriptionUser = this.fire.getUserObservable().subscribe(user => {
        this.fullUser = user;
        // console.log('User from transfer: ', this.fullUser);
      });
    }
    if (!this.subscriptionBanksUser) {
      this.subscriptionBanksUser = this.fire.getBanksUserObservable().subscribe(banks => {
        console.log(banks);
        this.banks = banks;
        this.bank = banks[0];
        if (this.bank) {
          this.bankNickName = this.bank.bank + ' ****' + this.bank.last4;
        }
      });
    }
  }

  setMax() {
    this.transaction.cop = this.fullUser.balance;
  }

  checkInput() {
    if (this.transaction.cop && this.transaction.cop <= this.fullUser.balance) {
      if (this.transaction.paymentMethod === 'Efectivo') {
        this.ready = true;
      } else if (this.transaction.paymentMethod === 'Transferencia' && this.bank) {
        this.ready = true;
      } else {
        this.ready = false;
      }
    } else {
      this.ready = false;
    }
    this.parserTransaction();
  }

  async userBanks() {
    const popover = await this.modalController.create({
      component: UserBanksComponent,
      cssClass: 'dialog-modal',
      componentProps: {
        edit: false,
        banks: this.banks
      }
    });
    await popover.present();
    await popover.onDidDismiss().then((data) => {
      if (data.data) {
        this.transaction.bank = data.data;
        this.bankNickName = data.data.bank + ' ****' + data.data.last4;
      }
    });
  }

  async confirm() {
    const resp = await this.fire.createWithdraw(this.fullUser.uid, this.transaction);
    console.log(resp);
    let msg: string;
    const title = 'Hemos recibido su requerimiento de retiro';
    if (this.transaction.paymentMethod === this.variables.paymentMethods[0]) {
      msg = 'Dentro de las siguientes ' + this.variables.timeToWithdraw + ' horas realizaremos la transaferencia de tu retiro';
    } else if (this.transaction.paymentMethod === this.variables.paymentMethods[1]) {
      msg = 'En breve te contactaremos al ', + this.transaction.ownerPhoneNumber + ' para coordinar la entrega de tu dinero.';
    }
    const msg1 = 'Nueva solicitud de retiro: \n' + 'Cliente: ' + this.fullUser.displayName + '\n' + 'ClienteID: ' + this.fullUser.uid + '\n';
    const msg2 = 'Método de pago: ' + this.transaction.paymentMethod + '\n' + 'Monto: ' + this.transaction.cop  + '\n';
    const msgTelegram = msg1 + msg2;
    this.subscriptionHttp = this.utilities.sendTelegramMsg(msgTelegram, this.variables.telegramURL).subscribe(telegramResp => console.log('Telegram resp', telegramResp));
    await this.alerts.presentAlertSimple(null, msg, 'Cerrar', title);
    const newBalance = this.fullUser.balance - this.transaction.cop;
    await this.fire.editUserBalance(this.fullUser.uid, newBalance);
    this.transaction.cop = 0;
    // this.close();
  }

  parserTransaction() {
    this.transaction.owner = this.fullUser.displayName;
    this.transaction.ownerPhoneNumber = this.fullUser.phoneNumber;
    if (this.transaction.paymentMethod === 'Transferencia') {
      this.transaction.bank = this.bank.bank;
      this.transaction.bankType = this.bank.type;
      this.transaction.bankNumber = this.bank.accountNumber;
      this.transaction.bankOwner = this.bank.owner;
      this.transaction.ownerIdType = this.bank.ownerIdType;
      this.transaction.ownerId = this.bank.ownerId;
    }
  }

  async close() {
    this.modalController.dismiss();
  }

  ngOnDestroy() {
    if (this.subscriptionUser) {
      this.subscriptionUser.unsubscribe();
    }
    if (this.subscriptionBanksUser) {
      this.subscriptionBanksUser.unsubscribe();
    }
    if (this.subscriptionHttp) {
      this.subscriptionHttp.unsubscribe();
    }
  }

}

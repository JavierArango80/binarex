/* eslint-disable max-len */
import { UtilitiesService } from './../../services/utilities.service';
import { AlertsService } from './../../services/alerts.service';
import { ModalController } from '@ionic/angular';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { usdtPrice, FirestoreService } from '../../services/firestore.service';
import { first } from 'rxjs/operators';
import { Transaction } from '../../interfaces/transaction';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss'],
})
export class DepositComponent implements OnInit, OnDestroy {

  public subscriptionUser: Subscription;
  public subscriptionHttp: Subscription;
  public fullUser: User;
  public usdt: Observable<usdtPrice>;
  public usdtBuy: string;
  public transaction: Transaction;
  public variables;
  public banks;
  public bank;
  public paymentPlace;
  public bankNumber: number;
  public placeNumber: number;
  public paymentPlaces: any[];

  constructor(
    private modalController: ModalController,
    private fire: FirestoreService,
    private alerts: AlertsService,
    private utilities: UtilitiesService
  ) {
    this.usdt =  this.fire.getUsdtObservable();
   }

  async ngOnInit() {
    this.bankNumber = 0;
    this.placeNumber = 0;
    this.variables = await this.fire.getVariables();
    // console.log(this.variables);
    this.banks = await this.fire.getBanks();
    this.paymentPlaces = await this.fire.getPaymentPlaces();
    this.parserBank();
    this.parserPlace();
    this.resetTransaction();
    this.usdt.pipe(first()).toPromise().then(usdt => {
      if (usdt) {
        this.usdtBuy = usdt.buy;
        // console.log('usdtBuy: ', this.usdtBuy);
        // console.log('TRM: ', this.trm);
      }
    });
    if (!this.subscriptionUser) {
      this.subscriptionUser = this.fire.getUserObservable().subscribe(user => {
        this.fullUser = user;
        // console.log('User from tab1: ', this.fullUser);
      });
    }
  }

  resetTransaction() {
    this.transaction = {
      paymentMethod: this.variables.paymentMethods[this.bankNumber],
      paymentPlace: this.variables.paymentPlaces[this.placeNumber],
      bank: 'Bancolombia',
      cop: 0,
      usdt: 0
    };
  }

  parserBank() {
    this.bank = {
      logo: this.banks[this.bankNumber].logo,
      nit: this.banks[this.bankNumber].Nit,
      owner: this.banks[this.bankNumber].Owner,
      accountNumber: this.banks[this.bankNumber].accountNumber,
      type: this.banks[this.bankNumber].type,
      bank: this.banks[this.bankNumber].bank
    };
  }

  parserPlace() {
    this.paymentPlace = {
      link: this.paymentPlaces[this.bankNumber].link,
      name: this.paymentPlaces[this.bankNumber].name,
      address: this.paymentPlaces[this.bankNumber].address,
      country: this.paymentPlaces[this.bankNumber].country,
      city: this.paymentPlaces[this.bankNumber].city,
      person: this.paymentPlaces[this.bankNumber].person,
      timing: this.paymentPlaces[this.bankNumber].timing
    };
  }

  changeBank() {
    this.bankNumber = this.banks.map(x => x.bank).indexOf(this.transaction.bank);
    this.parserBank();
  }

  changePlace() {
    this.placeNumber = this.paymentPlaces.map(x => x.name).indexOf(this.transaction.paymentPlace);
    this.parserPlace();
  }

  checkTransaction() {
    // console.log('transaccion ', this.transaction.cop );
    if (this.transaction.cop < this.variables.depositMinimum) {
      const msg = 'El valor del depósito debe ser mayor a COP ' + this.variables.depositMinimum;
      this.alerts.presentAlertSimple('Depósito mínimo insuficiente', msg);
    } else if (this.transaction.cop > this.variables.depositMax) {
      const msg = 'El depósito máximo autorizado son COP ' + this.variables.depositMax;
      this.alerts.presentAlertSimple('Depósito máximo superado', msg);
    } else {
      this.confirm();
    }
  }

  async confirm() {
    const resp = await this.fire.createDepositUser(this.fullUser.uid, this.transaction, (3600000 * this.variables.timeToDeposit));
    console.log(resp);
    let msg: string;
    let title: string;
    if (this.transaction.paymentMethod === this.variables.paymentMethods[0] || this.transaction.paymentMethod === this.variables.paymentMethods[1]) {
      msg = 'Recuerda que debes subir el comprobante de pago en la sección de Historial antes de las siguientes ' + this.variables.timeToDeposit + ' horas';
      title = 'Hemos recibido su requerimiento de depósito satisfactoriamente';
    } else if (this.transaction.paymentMethod === this.variables.paymentMethods[2]) {
      msg = 'Recuerda que debes hacer la entrega del dinero antes de las siguientes ' + this.variables.timeToDeposit + ' horas';
      title = 'Hemos recibido su requerimiento de depósito satisfactoriamente';
    } else if (this.transaction.paymentMethod === this.variables.paymentMethods[3]) {
      msg = 'Tu depósito ha sido agregado a tu saldo';
      title = 'El pago se ha completado exitósamente!';
    }
    const msg1 = 'Nueva solicitud de depósito: \n' + 'Cliente: ' + this.fullUser.displayName + '\n' + 'ClienteID: ' + this.fullUser.uid + '\n';
    const msg2 = 'Método de pago: ' + this.transaction.paymentMethod + '\n' + 'Monto: ' + this.transaction.cop  + '\n';
    const msgTelegram = msg1 + msg2;
    this.subscriptionHttp = this.utilities.sendTelegramMsg(msgTelegram, this.variables.telegramURL).subscribe(respTelegram => console.log('Telegram resp', respTelegram));
    this.alerts.presentAlertSimple(null, msg, 'Entendido', title);
    this.resetTransaction();
    this.close();
  }

  async close() {
    this.modalController.dismiss();
  }

  ngOnDestroy() {
    if (this.subscriptionUser) {
      this.subscriptionUser.unsubscribe();
    }
    if (this.subscriptionHttp) {
      this.subscriptionHttp.unsubscribe();
    }
  }

}

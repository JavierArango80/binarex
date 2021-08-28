/* eslint-disable max-len */
import { UtilitiesService } from './../../services/utilities.service';
import { User } from './../../interfaces/user';
import { AlertsService } from './../../services/alerts.service';
import { Transaction } from './../../interfaces/transaction';
import { FirestoreService, usdtPrice } from './../../services/firestore.service';
import { Observable, Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-admin-modulo',
  templateUrl: './admin-modulo.component.html',
  styleUrls: ['./admin-modulo.component.scss'],
})
export class AdminModuloComponent implements OnInit, OnDestroy {

  @Input() usdt: Observable<usdtPrice>;
  @Input() fullUser: User;
  deposits: Transaction[];
  withdraws: Transaction[];
  variables;
  user: User;
  users: User[];
  private subscriptionUsers: Subscription;
  private subscriptionHttp: Subscription;


  constructor(
    private modalController: ModalController,
    private fire: FirestoreService,
    private alerts: AlertsService,
    private utilities: UtilitiesService
  ) { }

  async ngOnInit() {
    this.variables = await this.fire.getVariables();
    this.deposits = [];
    this.withdraws = [];
    this.getUsers();
  }

  async getUsers() {
    this.subscriptionUsers = this.fire.getUsers().subscribe((users) => {
      this.users = users;
      this.getTransactions();
    });
  }

  async getTransactions() {
    this.users.map(async user => {
      let deposits = await this.fire.getDepositsUserP(user.uid);
      deposits = deposits.filter(obj => obj.status === 'Pendiente');
      deposits.map(item => {
        item.user = user.displayName + ' / ' + user.phoneNumber;
        item.userId = user.uid;
        item.oldBalance = user.balance;
      });
      this.deposits = this.deposits.concat(deposits);
      this.deposits = this.utilities.removeDuplicates(this.deposits);
      // console.log('User deposits are: ', this.deposits);

      let withdraws = await this.fire.getWithdrawsUserP(user.uid);
      withdraws = withdraws.filter(obj => obj.status === 'Pendiente');
      withdraws.map(item => {
        item.user = user.displayName + ' / ' + user.phoneNumber;
        item.userId = user.uid;
        item.oldBalance = user.balance;
      });
      this.withdraws = this.withdraws.concat(withdraws);
      this.withdraws = this.utilities.removeDuplicates(this.withdraws);
      // console.log('User withdraws are: ', this.withdraws);
    });
  }

  async approve(item: Transaction, type: string) {
    const resp = await this.alerts.presentAlertInput('La transacción será aprobada', 'Desea continuar?', 'Aprobar', 'Cancelar');
    // console.log(resp);
    let msg1: string;
    let msg2: string;
    let msg3: string;
    let msg4: string = null;
    if (resp.approved) {
      item.notes = resp.notes;
      item.status = 'Aprobado';
      await this.fire.editDepositUser(item.userId, item);
      if (type === 'deposit') {
        msg1 = 'Depósito aprobado: \n' + 'Admin: ' + this.fullUser.displayName + '\n' + 'AdminID: ' + this.fullUser.uid + '\n';
        msg2 = 'Cliente: ' + item.user + '\n' + 'ClienteID: ' + item.userId + '\n' + 'Monto: ' + item.cop + '\n';
        msg3 = 'Hora: ' + new Date(item.time) + '\n' + 'Id: ' + item.id;
        await this.fire.editUserBalance(item.userId, (item.cop + item.oldBalance));
      } else {
        msg1 = 'Retiro aprobado: \n' + 'Admin: ' + this.fullUser.displayName + '\n' + 'AdminID: ' + this.fullUser.uid + '\n';
        msg2 = 'Cliente: ' + item.user + '\n' + 'ClienteID: ' + item.userId + '\n' + 'Monto: ' + item.cop + '\n';
        msg3 = 'Hora: ' + new Date(item.time) + '\n' + 'Id: ' + '\n' + item.id + '\n' + 'Método de pago: ' + item.paymentMethod + '\n';
        if (item.paymentMethod === 'Transferencia') {
          msg4 =  'Banco: ' + item.bank  + '\n' + 'Cuenta: ' + item.bankNumber + ' - ' + item.bankType  + '\n' + 'Beneficiario: ' + item.bankOwner  + '\n' + 'Cédula: ' + item.ownerId;
        }
      }
      const msg = msg1 + msg2 + msg3 + msg4;
     this.subscriptionHttp = this.utilities.sendTelegramMsg(msg, this.variables.telegramURL).subscribe(respHttp => respHttp);
    }

  }

  async reject(item: Transaction, type: string) {
    const resp = await this.alerts.presentAlertInput('La transacción será rechazada', 'Desea continuar?', 'Rechazar', 'Cancelar');
    console.log(resp);
    if (resp.approved) {
      item.notes = resp.notes;
      item.status = 'Rechazado';
      await this.fire.editDepositUser(item.userId, item);
      if (type === 'withdraw') {
        await this.fire.editUserBalance(item.userId, (item.cop + item.oldBalance));
      }
    }
  }

  async saveChanges() {
    this.usdt.pipe(first()).toPromise().then(async usdtRef => {
      usdtRef = {
        buy: parseInt(usdtRef.buy, 10),
        sell: parseInt(usdtRef.sell, 10)
      };
      console.log(usdtRef);
      await this.fire.updateUsdtPrices(usdtRef);
      this.close();
    });
  }

  async toogleTrm() {
    console.log(this.variables.trmAut);
    await this.fire.editTrmAut(this.variables.trmAut);
  }


  reload() {
    this.ngOnInit();
  }

  async close() {
    this.modalController.dismiss();
  }

  showUsdt() {
    this.usdt.subscribe(x => {
      const buy = x.buy;
      console.log('USDT buy is ', parseInt(buy, 10));
    });
  }

  ngOnDestroy() {
    if (this.subscriptionUsers) {
      this.subscriptionUsers.unsubscribe();
    }
    if (this.subscriptionHttp) {
      this.subscriptionHttp.unsubscribe();
    }
  }

}

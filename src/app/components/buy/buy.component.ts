import { AlertsService } from './../../services/alerts.service';
import { ModalController } from '@ionic/angular';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { usdtPrice, FirestoreService } from '../../services/firestore.service';
import { Transaction } from '../../interfaces/transaction';
import { User } from '../../interfaces/user';
import TrmApi from 'trm-api';
import { first } from 'rxjs/operators';
const trmApi = new TrmApi();

@Component({
  selector: 'app-buy',
  templateUrl: './buy.component.html',
  styleUrls: ['./buy.component.scss']
})
export class BuyComponent implements OnInit, OnDestroy {

  @Input() mode: string;
  fullUser: User;
  usdt: Observable<usdtPrice>;
  usdtBuy: number;
  usdtSell: number;
  // trm: number;
  transaction: Transaction;
  amount1: number = null;
  amount2: number = null;
  amountMaxCop: number;
  amountMaxUSDT: number;
  ready = false;
  usdtGap: number;
  usdtGapPer: number;
  variables;
  updateUsdt = true;
  private subscriptionUser: Subscription;
  private subscriptionUsdt: Subscription;

  constructor(
    private modalController: ModalController,
    private fire: FirestoreService,
    private alerts: AlertsService
  ) {
    this.usdt =  this.fire.getUsdtObservable();
   }

  async ngOnInit() {
    this.parserTransaction();
    this.variables = await this.fire.getVariables();
    this.usdtGap = this.variables.usdtGap;
    this.usdtGapPer = this.variables.usdtGapPer;
    this.getUsdt();
    if (!this.subscriptionUser) {
      this.subscriptionUser = this.fire.getUserObservable().subscribe(user => {
        this.fullUser = user;
        this.amountMaxCop = user.balance;
        this.amountMaxUSDT = user.balanceUsdt;
        // console.log('User from transfer: ', this.fullUser);
      });
    }
  }

  getUsdt() {
    this.subscriptionUsdt = this.usdt.subscribe(usdt => {
      if (usdt) {
        this.usdtBuy = usdt.buy;
        this.usdtSell = usdt.sell;
        // console.log('usdtBuy', this.usdtBuy);
        // console.log('usdtSell', this.usdtSell);
        this.getTrm();
      }
    });
  }

  async getTrm() {
    // console.log(this.variables);
    if (this.updateUsdt) {
      this.updateUsdt = false;
      if (this.variables.trmAut) {
        trmApi.latest().then(async (data) => {
          console.log(data);
          if (data && data.valor) {
            const trm =  parseInt(data.valor, 10);
            const usdtSell = await this.usdt.pipe(first()).toPromise().then(prices => prices.sell);
            const newUsdtSell = trm + trm * this.variables.usdtGap;
            // console.log('TRM plus margin is ', newUsdtSell);
            // console.log('usdtSell is', usdtSell);
            const margin = Math.abs(usdtSell - newUsdtSell);
            // console.log(margin);
            const x = newUsdtSell * this.usdtGapPer;
            // console.log(x);
            if (margin >= x) {
              console.log('Update UsdtSellPrice');
              await this.fire.editUsdtSell(trm.toString());
            }
          }
        })
        .catch((error) => console.log(error));
        setTimeout(() => {
          this.updateUsdt = true;
        }, 3600000);
      }
    }
  }

  parserTransaction() {
    console.log('Mode is: ', this.mode);
    this.transaction = {
      cop: null,
      usdt: 0,
      from: null,
      to: null
    };
    if (this.mode === 'buy') {
      this.transaction.from = 'COP';
      this.transaction.to = 'USDT';
      this.amount1 = this.transaction.cop;
      this.amount2 = this.transaction.usdt;
    } else {
      this.transaction.from = 'USDT';
      this.transaction.to = 'COP';
      this.amount2 = this.transaction.cop;
      this.amount1 = this.transaction.usdt;
    }
    console.log('This transaction is: ', this.transaction);
  }

  setMax() {
    if (this.mode === 'buy') {
      this.amount1 = this.amountMaxCop;
    } else {
      this.amount1 = this.amountMaxUSDT;
    }
  }

  calculateUsdt(event) {
    this.amount1 = parseInt(event.detail.value, 10);
    if (this.mode === 'buy') {
      this.amount2 = (this.amount1) / this.usdtBuy;
      if (this.amount1 && this.amount1 <= this.amountMaxCop) {
        this.ready = true;
      } else {
        this.ready = false;
      }
    } else {
      this.amount2 = (this.amount1) * this.usdtSell;
      if (this.amount1 && this.amount1 <= this.amountMaxUSDT) {
        this.ready = true;
      } else {
        this.ready = false;
      }
    }
  }

  swapMode() {
    if (this.mode === 'buy') {
      this.mode = 'sell';
    } else {
      this.mode = 'buy';
    }
    this.parserTransaction();
  }

  async confirm() {
    if (this.mode === 'buy') {
      this.fullUser.balanceUsdt = this.amount2 + this.fullUser.balanceUsdt;
      this.fullUser.balance = this.fullUser.balance - this.amount1;
      this.fullUser.holdTimeUntil = Date.now() + (3600000 * 24 * this.variables.holdTime);
    } else if (this.mode === 'sell'){
      console.log(this.fullUser.holdTimeUntil);
      if (Date.now() >= this.fullUser.holdTimeUntil) {
        this.fullUser.balance = this.fullUser.balance + this.amount2;
        this.fullUser.balanceUsdt = this.fullUser.balanceUsdt - this.amount1;
      } else  {
        const title = 'Lo sentimos, aun no puedes vender tus USDT';
        const msg = 'Debes esperar hasta ' + new Date(this.fullUser.holdTimeUntil) + ' para realizar esta operación.';
        this.alerts.presentAlertSimple(title, msg, 'Entendido');
      }
    }
    console.log('User with new Balances ', this.fullUser);
    this.amount1 = null;
    this.amount2 = 0;
    await this.fire.createUser(this.fullUser);
  }

  close() {
    this.modalController.dismiss();
  }

  ngOnDestroy() {
    if (this.subscriptionUser) {
      this.subscriptionUser.unsubscribe();
    }
    if (this.subscriptionUsdt) {
      this.subscriptionUsdt.unsubscribe();
    }
  }

}

import { WithdrawComponent } from './../components/withdraw/withdraw.component';
import { DepositComponent } from './../components/deposit/deposit.component';
import { BuyComponent } from './../components/buy/buy.component';
import { FirestoreService, usdtPrice } from './../services/firestore.service';
import { Order } from './../interfaces/order';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { User } from '../interfaces/user';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {

  usdt: Observable<usdtPrice>;
  timer = true;
  rate: number;
  trade: Order;
  currencies: string[];
  ready = false;
  fullUser: User;
  private subscriptionUser: Subscription;

  constructor(
    private modalController: ModalController,
    private fire: FirestoreService  ) {
    this.usdt =  this.fire.getUsdtObservable();
   }

  ngOnInit() {
    this.rate = 16;
    this.currencies = ['COP', 'USD'];
    this.trade = {
      rate: this.rate,
      currency: 'COP',
      invest: null,
      profit: 0
    };
    if (!this.subscriptionUser) {
      this.subscriptionUser = this.fire.getUserObservable().subscribe(user => {
        this.fullUser = user;
        // console.log('User from tab1: ', this.fullUser);
      });
    }
  }

  changeValue(event) {
    const x = event.detail.value;
    const value = parseInt(x, 10);
    this.trade.invest = value;
    // console.log('Invest ', this.trade.invest);
    this.trade.profit = (this.rate * this.trade.invest) / 100;
    // console.log('Profit ', this.trade.profit);
  }

  async openDeposit() {
    const popover = await this.modalController.create({
      component: DepositComponent,
      cssClass: 'dialog-modal',
      componentProps: {
      }
    });
    await popover.present();
  }

  async openTransfer(mode: string) {
    const popover = await this.modalController.create({
      component: BuyComponent,
      cssClass: 'dialog-modal',
      componentProps: {
        mode
      }
    });
    await popover.present();
  }

  async openWithdraw() {
    const popover = await this.modalController.create({
      component: WithdrawComponent,
      cssClass: 'dialog-modal',
      componentProps: {
      }
    });
    await popover.present();
  }

  ngOnDestroy() {
    if (this.subscriptionUser) {
      this.subscriptionUser.unsubscribe();
    }
  }

}

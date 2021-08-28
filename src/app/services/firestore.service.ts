/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/naming-convention */
import { Order } from './../interfaces/order';
import { Injectable } from '@angular/core';
import { AngularFirestore  } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { User } from '../interfaces/user';
import { Transaction } from '../interfaces/transaction';
import { Bank } from '../interfaces/bank';

export interface usdtPrice {
  buy?: any,
  sell?: any
}

@Injectable({
  providedIn: 'root'
})

export class FirestoreService {

  public userId: string;
  private usdtPrice: BehaviorSubject<any> = new BehaviorSubject(null);
  private fullUser: BehaviorSubject<User> = new BehaviorSubject(null);
  private banksUser: BehaviorSubject<any> = new BehaviorSubject(null);
  private subscriptionUsdt: Subscription;
  private subscriptionUser: Subscription;
  private subscriptionBanksUser: Subscription;

  constructor(
    private afs: AngularFirestore
    ) {
      this.getUsdtPrice().pipe(first()).toPromise().then(usdt => {
        if (usdt) {
          // console.log('USDT prices are: ', usdt);
          this.subscribeUsdt();
        }
      });
    }

    initUserSubscription(userId: string) {
      this.userId = userId;
      this.getUser(userId).pipe(first()).toPromise().then(user => {
        if (user) {
          // console.log('USDT prices are: ', usdt);
          this.subscribeUser();
        }
      });
      this.getBanksUserData(userId).pipe(first()).toPromise().then(banks => {
        if (banks) {
          // console.log('USDT prices are: ', usdt);
          this.subscribeBanksUser();
        }
      });
    }

    getUsdtObservable() {
      return this.usdtPrice.asObservable();
    }

    getUserObservable() {
      return this.fullUser.asObservable();
    }

    getBanksUserObservable() {
      return this.banksUser.asObservable();
    }

    getTyC(): Promise<any>  {
      return this.afs.doc(`tyc/disclaimer`).valueChanges().pipe(first()).toPromise().then(tyc => tyc);
    }

    subscribeUsdt() {
      if (!this.subscriptionUsdt) {
          this.subscriptionUsdt = this.afs.doc(`prices/USDT`).valueChanges().subscribe(usdt => {
            // console.log('Usdt price form FireStore is: ', usdt);
            this.usdtPrice.next(usdt);
          });
      }
    }

    getUsers(): Observable<any[]> {
      return this.afs.collection(`users`).valueChanges();
    }

    getDepositsUserP(userId): Promise<any[]> {
      return this.afs.collection(`users/${userId}/deposits`).valueChanges().pipe(first()).toPromise().then(transactions => transactions);
    }

    getWithdrawsUserP(userId): Promise<any[]> {
      return this.afs.collection(`users/${userId}/withdraws`).valueChanges().pipe(first()).toPromise().then(transactions => transactions);
    }

    subscribeUser() {
      if (!this.subscriptionUser) {
        this.subscriptionUser = this.afs.doc(`users/${this.userId}`).valueChanges().subscribe(user => {
          this.fullUser.next(user);
        });
      }
    }

    subscribeBanksUser() {
      if (!this.subscriptionBanksUser) {
        this.subscriptionBanksUser = this.afs.collection(`users/${this.userId}/banks`).valueChanges().subscribe(banks => {
          this.banksUser.next(banks);
        });
      }
    }

    async createId(): Promise<string> {
      return this.afs.createId();
    }

    async createUser(user: any): Promise<User> {
      await this.afs.doc(`users/${user.uid}`).set(JSON.parse( JSON.stringify(user)), {merge: true});
      return user;
    }

    async createOrder(order: Order): Promise<string> {
      order.id = await this.createId();
      order.msg = order.msg + '. https://binarex.web.app/orderId/' + order.id;
      await this.afs.doc(`orders/${order.id}`).set(JSON.parse( JSON.stringify(order)), {merge: true});
      return order.id;
    }

    getUsdtPrice(): Observable<usdtPrice> {
      return this.afs.doc<usdtPrice>(`prices/USDT`).valueChanges();
    }

    getBanksUserData(userId: string): Observable<Bank[]> {
      return this.afs.collection<Bank>(`users/${userId}/banks`).valueChanges();
    }

    getDepositsUser(userId: string): Observable<Bank[]> {
      return this.afs.collection<Bank>(`users/${userId}/deposits`).valueChanges();
    }

    getWithdrawsUser(userId: string): Observable<Bank[]> {
      return this.afs.collection<Bank>(`users/${userId}/withdraws`).valueChanges();
    }

    async updateUsdtPrices(usdtPrices) {
      await this.afs.doc(`prices/USDT`).set(JSON.parse( JSON.stringify(usdtPrices)), {merge: true});
      return true;
    }

    getUser(userId: string): Observable<any> {
      return this.afs.doc<any>(`users/${userId}`).valueChanges();
    }

    getFullUser(userId: string) {
      this.getUser(userId).subscribe(user => {
        this.fullUser = user;
      });
    }

    getVariables(): Promise<any> {
      return this.afs.doc(`admin/variables`).valueChanges().pipe(first()).toPromise();
    }

    getBanks(): Promise<any> {
      return this.afs.collection(`Banks`).valueChanges().pipe(first()).toPromise();
    }

    getPaymentPlaces(): Promise<any> {
      return this.afs.collection(`paymentPlaces`).valueChanges().pipe(first()).toPromise();
    }

    async createBankUser(userId, bankInfo) {
      if (!bankInfo.id) {
        const id = await this.afs.createId();
        bankInfo.id = id;
      }
      await this.afs.doc(`users/${userId}/banks/${bankInfo.id}`).set(JSON.parse( JSON.stringify(bankInfo)), {merge: true});
      return bankInfo.id;
    }

    async createDepositUser(userId, depositInfo: Transaction, waitTime) {
      const id = await this.afs.createId();
      depositInfo.id = id;
      depositInfo.direction = 'Depósito';
      depositInfo.status = 'Pendiente';
      const timeInit = Date.now();
      depositInfo.time = new Date(timeInit);
      const timeFinal = timeInit + waitTime;
      depositInfo.timeUntil = new Date(timeFinal);
      depositInfo.timeUntil2 = timeFinal;
      // console.log(depositInfo);
      await this.afs.doc(`users/${userId}/deposits/${depositInfo.id}`).set(JSON.parse( JSON.stringify(depositInfo)), {merge: true});
      return depositInfo.id;
    }

    async editDepositUser(userId, depositInfo: Transaction) {
      await this.afs.doc(`users/${userId}/deposits/${depositInfo.id}`).set(JSON.parse( JSON.stringify(depositInfo)), {merge: true});
      return depositInfo.id;
    }

    async createWithdraw(userId, depositInfo: Transaction): Promise<Transaction> {
      const id = await this.afs.createId();
      depositInfo.id = id;
      depositInfo.direction = 'Retiro';
      depositInfo.status = 'Pendiente';
      depositInfo.time = new Date(Date.now());
      // console.log(depositInfo);
      await this.afs.doc(`users/${userId}/withdraws/${depositInfo.id}`).set(JSON.parse( JSON.stringify(depositInfo)), {merge: true});
      return depositInfo;
    }

    async editWithdraw(userId, depositInfo: Transaction) {
      await this.afs.doc(`users/${userId}/withdraws/${depositInfo.id}`).set(JSON.parse( JSON.stringify(depositInfo)), {merge: true});
      return depositInfo.id;
    }

    async editUserBalance(userId, balance) {
      console.log(balance);
      await this.afs.doc(`users/${userId}`).set({
        balance
      }, {merge: true});
      return userId;
    }

    async editTrmAut(trmAut: boolean) {
      await this.afs.doc(`admin/variables`).set({
        trmAut
      }, {merge: true});
      return trmAut;
    }

    async editUsdtSell(sell: string): Promise<string> {
      await this.afs.doc(`prices/USDT`).set({
        sell
      }, {merge: true});
      return sell;
    }

    async deleteBankUser(userId: string, bankId: string) {
      await this.afs.doc(`users/${userId}/banks/${bankId}`).delete();
      return bankId;
    }

}

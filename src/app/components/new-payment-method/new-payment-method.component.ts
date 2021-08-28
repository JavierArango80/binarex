import { Bank } from './../../interfaces/bank';
import { User } from './../../interfaces/user';
import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-new-payment-method',
  templateUrl: './new-payment-method.component.html',
  styleUrls: ['./new-payment-method.component.scss'],
})
export class NewPaymentMethodComponent implements OnInit {

  @Input() newPaymentMethod: Bank;
  @Input() user: User;
  public bank: Bank;
  public paymentMethods: string[];
  public variables: any;

  constructor(
    private modalController: ModalController,
    private fire: FirestoreService
  ) { }

  async ngOnInit() {
    this.paymentMethods = ['Ahorros', 'Corriente'];
    this.bank = {
      owner: null,
      accountNumber: null
    };
    this.variables = await this.fire.getVariables();
    if (!this.newPaymentMethod) {
      this.clearNewPayment();
    }
  }

  clearNewPayment() {
    this.newPaymentMethod = {
      type: null,
      owner: null,
      accountNumber: null,
      bank: null
    };
  }

  async confirm() {
    console.log('NewPayment ', this.newPaymentMethod);
    const bank: number = this.newPaymentMethod.accountNumber;
    const bankString = bank.toString();
    this.newPaymentMethod.last4 = bankString.slice(bankString.length - 4);
    const resp = await this.fire.createBankUser(this.user.uid, this.newPaymentMethod);
    console.log(resp);
    this.close();
  }

  async close() {
    this.clearNewPayment();
    this.modalController.dismiss();
  }

}

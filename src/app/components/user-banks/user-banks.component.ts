import { AlertsService } from './../../services/alerts.service';
import { NewPaymentMethodComponent } from './../new-payment-method/new-payment-method.component';
import { User } from './../../interfaces/user';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { FirestoreService } from '../../services/firestore.service';
import { Bank } from 'src/app/interfaces/bank';

@Component({
  selector: 'app-user-banks',
  templateUrl: './user-banks.component.html',
  styleUrls: ['./user-banks.component.scss'],
})
export class UserBanksComponent implements OnInit, OnDestroy {

  @Input() edit: boolean;
  @Input() banks: Bank[];
  private subscriptionUser: Subscription;
  // private subscriptionBanksUser: Subscription;
  fullUser: User;
  last4: string;

  constructor(
    private modalController: ModalController,
    private fire: FirestoreService,
    private alerts: AlertsService
  ) { }

  ngOnInit() {
    if (!this.subscriptionUser) {
      this.subscriptionUser = this.fire.getUserObservable().subscribe(user => {
        this.fullUser = user;
        // console.log(this.fullUser);
      });
    }
/*     if (!this.subscriptionBanksUser) {
      this.subscriptionBanksUser = this.fire.getBanksUserObservable().subscribe(banks => {
        this.banks = banks;
      });
    } */
  }

  async newPaymentMethod() {
    const popover = await this.modalController.create({
      component: NewPaymentMethodComponent,
      cssClass: 'dialog-modal',
      componentProps: {
        user: this.fullUser
      }
    });
    await popover.present();
  }

  clickBank(bank) {
    if(!this.edit) {
      this.close(bank);
    } else {
      this.editPayment(bank);
    }
  }

  async editPayment(bank) {
    const popover = await this.modalController.create({
      component: NewPaymentMethodComponent,
      cssClass: 'dialog-modal',
      componentProps: {
        user: this.fullUser,
        newPaymentMethod: bank
      }
    });
    await popover.present();
  }

  async deletePayment(item) {
    const resp = await this.alerts.presentAlert('Precaución!', 'Si continuas se borrará el método de pago', 'Continuar', 'Cancelar');
    // console.log('Resp from alert ', resp);
    if (resp) {
      await this.fire.deleteBankUser(this.fullUser.uid, item.id);
    }
  }

  close(value?) {
    this.modalController.dismiss(value);
  }

  ngOnDestroy() {
    if (this.subscriptionUser) {
      this.subscriptionUser.unsubscribe();
    }
/*     if (this.subscriptionBanksUser) {
      this.subscriptionBanksUser.unsubscribe();
    } */
  }

}

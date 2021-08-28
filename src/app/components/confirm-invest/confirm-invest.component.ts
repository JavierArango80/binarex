import { User } from './../../interfaces/user';
import { Order } from './../../interfaces/order';
import { FirestoreService } from './../../services/firestore.service';
import { ModalController, ToastController } from '@ionic/angular';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-confirm-invest',
  templateUrl: './confirm-invest.component.html',
  styleUrls: ['./confirm-invest.component.scss'],
})


export class ConfirmInvestComponent implements OnInit {

  @Input() fullUser: User;
  @Input() order: Order;

  countries = ['Colombia', 'Ecuador', 'Panamà'];

  constructor(
    private modalController: ModalController,
    private fire: FirestoreService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {

    this.countries = ['Colombia', 'Ecuador', 'Panamà'];
    console.log('fullUser is ', this.fullUser.displayName);
  }

  async confirmOrder() {
    const order: Order = {
      userId: 'kljasdljkasjd',
      date: Date.now(),
      userName: this.fullUser.displayName,
      paymentMethod: 'transfer',
      bank: 'Bancolombia',
      currency: 'COP',
      msg: 'Mensaje de prueba Binarex'
    };
    await this.fire.createOrder(order);
    await this.presentToast('Orden recibida', 'dark');
    this.close();
  }

  async presentToast( header: string, color: string, duration: number = 2000,
    translucent = false ) {
    const toast = await this.toastCtrl.create({
      header,
      position: 'bottom',
      color,
      animated: true,
      duration,
      buttons: [
        {
          text: null,
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ],
      translucent,
      mode: 'ios'
    });
    toast.present();
  }

  async close() {
    this.modalController.dismiss();
  }

}

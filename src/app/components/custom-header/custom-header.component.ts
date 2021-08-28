import { User } from './../../interfaces/user';
import { ModalController } from '@ionic/angular';
import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { usdtPrice } from 'src/app/services/firestore.service';
import { AdminModuloComponent } from '../admin-modulo/admin-modulo.component';

@Component({
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss'],
})
export class CustomHeaderComponent implements OnInit {

  @Input() usdt: Observable<usdtPrice>;
  @Input() fullUser: User;
  binarexSmall: string;

  constructor(
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.binarexSmall = './../../assets/imgs/Binarex250-200.jpeg';
  }

  async adminEdit() {
    if (this.fullUser.admin) {
      // console.log('user', user);
      const popover = await this.modalController.create({
        component: AdminModuloComponent,
        cssClass: 'dialog-modal',
        componentProps: {
          usdt: this.usdt,
          fullUser: this.fullUser
        }
      });
      await popover.present();
    }
  }

}

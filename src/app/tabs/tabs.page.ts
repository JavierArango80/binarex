/* eslint-disable @typescript-eslint/naming-convention */
import { User } from './../interfaces/user';
import { AlertsService } from './../services/alerts.service';
import { Plugins } from '@capacitor/core';
import { Router } from '@angular/router';
import { FirestoreService } from './../services/firestore.service';
import { SignInComponent } from './../components/sign-in/sign-in.component';
import { AuthService } from './../services/auth.service';
import { Component, ViewChild } from '@angular/core';
import { IonTabs, ModalController } from '@ionic/angular';
import { first } from 'rxjs/operators';
const { App } = Plugins;

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  @ViewChild('tabs') tabs: IonTabs;
  selected = '';

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
    private fire: FirestoreService,
    private router: Router,
    private alerts: AlertsService
  ) {
    this.getUser();
  }

  async getUser() {
    const authUser = await this.authService.getAuthUser();
    if (authUser) {
      await this.fire.getUser(authUser.uid).pipe(first()).toPromise().then(user => {
        console.log('Firebase user from tabs', user);
        if (user) {
          this.fire.initUserSubscription(user.uid);
        } else {
          this.singIn(authUser);
        }
      });
    } else {
      this.singIn(authUser);
    }
  }

  async singIn(authUser) {
    const popover = await this.modalController.create({
      component: SignInComponent,
      cssClass: 'dialog-modal',
      componentProps: {
        authUser
      }
    });
    await popover.present();
    return popover.onDidDismiss().then(() => {
      this.getUser();
      this.router.navigate(['/tabs/tab1']);
    });
  }

  setSelectedTab() {
    this.selected = this.tabs.getSelected();
  }

  async goBack() {
    const modal = await this.modalController.getTop();
    if (modal) {
      modal.dismiss();
    } else {
    if (this.router.url === '/tabs/tab1') {
      console.log('home in explore');
      await this.backButtonAlert();
    } else {
      console.log('home in other place');
      this.router.navigate(['/tabs/tab1']);
    }
  }
  }

  async backButtonAlert() {
    const title = 'Cerrar App';
    const msg = '¿Deseas continuar?';
    const resp = await this.alerts.presentAlert(title, msg, 'Continuar', 'Cancelar');
    if (resp) {
      console.log('exit app');
      App.exitApp();
    }
  }

}

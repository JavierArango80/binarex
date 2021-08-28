import { Subscription } from 'rxjs';
import { Component } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { Router } from '@angular/router';
import { AlertsService } from './services/alerts.service';
import { PlatformLocation } from '@angular/common';
const { App } = Plugins;
const { version: appVersion } = require('../../package.json');


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  backButtonSub: Subscription;
  appVersion: any;

  constructor(
    private modalController: ModalController,
    private router: Router,
    private platform: Platform,
    private alerts: AlertsService,
    private location: PlatformLocation

  ) {
    this.backButtonEvent();
    this.appVersion = appVersion;
    console.log(this.appVersion);
    this.location.onPopState(async () => {
      console.log('ON POP');
      const modal = await this.modalController.getTop();
      if (modal) {
        modal.dismiss();
      }
    });
  }

  ionViewDidEnter() {
    console.log('App is Ready');
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(
      10000,
      () => {
        console.log('backbutton ready from components');
        this.goBack();
      }
    );
  }

  async backButtonEvent() {
    console.log('App is Ready');
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      console.log('backbutton ready from components');
      this.goBack();
    });
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

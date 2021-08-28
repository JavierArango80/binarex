import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  constructor(
    private alertController: AlertController,
    private loadingCtrl: LoadingController,
    private toastController: ToastController
  ) { }

  async showLoading(message?: string, duration = 2000) {
    const loading = await this.loadingCtrl.create({
      message,
      duration,
      backdropDismiss: true,
      spinner: 'crescent'
    });
    await loading.present();
    const { role, data } = await loading.onDidDismiss();
    console.log('Loading dismissed!');
  }


  async presentAlertSimple(header: string, message: string, okText: string = 'Entiendo', subHeader: string = null) {
    const alert = await this.alertController.create({
      // cssClass: 'my-custom-class',
      header,
      subHeader,
      message,
      buttons: [okText]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    // console.log('onDidDismiss resolved with role', role);
  }

  async presentAlert(header: string, message: string, okText: string, cancelText: string) {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            cssClass: 'secondary',
            handler: (cancel) => {
              resolve(false);
            }
          }, {
            text: okText,
            handler: (ok) => {
              resolve(true);
            }
          }
        ]
      });
      alert.present();
    });
  }

  async presentAlertInput(header: string, message: string, okText: string, cancelText: string): Promise<any> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        inputs: [
          {
            name: 'notes',
            placeholder: 'Notas'
          }
        ],
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            cssClass: 'secondary',
            handler: (data) => {
              if (data) {
                const resp = {
                  notes: data.notes,
                  approved: false
                };
                resolve(resp);
              }
            }
          },
          {
            text: okText,
            handler: (data) => {
              if (data) {
                const resp = {
                  notes: data.notes,
                  approved: true
                };
                resolve(resp);
              }
            }
          }
        ]
      });
      alert.present();
    });
  }

  async presentToast(message: string, color = 'dark', duration = 2000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color
    });
    toast.present();
  }
}

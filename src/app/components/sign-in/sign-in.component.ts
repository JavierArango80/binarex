/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable object-shorthand */
import { UtilitiesService } from './../../services/utilities.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirestoreService } from './../../services/firestore.service';
import { User } from './../../interfaces/user';
import { AlertsService } from './../../services/alerts.service';
import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from './../../services/auth.service';
import { Router } from '@angular/router';
import {  ModalController } from '@ionic/angular';
import firebase from 'firebase/app';
import * as firebaseui from 'firebaseui';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {

  @Input() authUser: any;
  ui: firebaseui.auth.AuthUI;
  variables;
  step = 1;
  logo = '../../../assets/imgs/Binarex250-200.jpeg';
  tyc: any;
  smsSend: boolean;
  codeSMS1: number;
  codeSMS2: number;
  fullUser: User = {
    displayName: null,
    email: null,
    photoURL: null,
    uid: null,
    provider: null,
    phoneNumber: null,
    createDate: null,
    balance: 0,
    balanceUsdt: 0,
    role: 'user'
  };

  constructor(
    private authService: AuthService,
    public router: Router,
    private modalController: ModalController,
    private fire: FirestoreService,
    private alerts: AlertsService,
    private afAuth: AngularFireAuth,
    private utilities: UtilitiesService
  ) { }

  async ngOnInit() {
    this.variables = await this.fire.getVariables();
    this.tyc = await this.fire.getTyC();
    if (this.authUser) {
      this.step = 2;
    } else {
      this.initAfAuth();
    }
  }

  initAfAuth() {
    this.afAuth.app.then(app => {
      const uiConfig = {
        signInOptions: [
          {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
          }
        ],
        tosUrl: 'https://www.freeprivacypolicy.com/live/7665b6bb-5392-45a2-99d1-3c96be55594c',
        privacyPolicyUrl: () => {
          console.log('The Privacy and Policy is ', 'https://www.freeprivacypolicy.com/live/7665b6bb-5392-45a2-99d1-3c96be55594c');
          window.location.assign('https://www.freeprivacypolicy.com/live/7665b6bb-5392-45a2-99d1-3c96be55594c');
        },
        callbacks: {
          signInSuccessWithAuthResult: this.onLoginSuccessful.bind(this)
        },
        uiShown: () => {
          document.getElementById('loader').style.display = 'none';
        }
      };
      this.ui = new firebaseui.auth.AuthUI(app.auth());
      this.ui.start('#firebaseui-auth-container', uiConfig);
      this.ui.disableAutoSignIn();
    });
  }

  async onLoginSuccessful(result) {
    // console.log('Result firebaseui is:', result);
    if(result.user) {
      this.authUser = result.user;
      const fullUser = await this.fire.getUser(this.authUser.uid).pipe(first()).toPromise().then(user => user);
      // console.log('Full user from singIn is ', fullUser);
      if (fullUser) {
        this.fullUser = fullUser;
        this.closeModal();
      } else {
        this.initFullUser();
        this.step = 2;
      }
    } else {
      console.log('Auth failed, restarting in 5s');
      setTimeout(() => {
        location.reload();
      }, 5000);
    }
    this.ui.delete();
    return false;
  }

  initFullUser() {
    if (this.authUser) {
      this.fullUser.displayName = this.authUser.displayName;
      this.fullUser.email = this.authUser.email;
      this.fullUser.uid = this.authUser.uid;
      this.fullUser.photoURL = this.authUser.photoURL;
      this.fullUser.provider = this.authUser.providerData[0].providerId;
      this.fullUser.createDate = Date.now();
    }
  }

  async checkPhoneNumber() {
    const firstItem = this.fullUser.phoneNumber.charAt(0);
    const length = this.fullUser.phoneNumber.length;
    let msg: string;
    let title: string;
    // console.log('Fisrt Item is: ', firstItem);
    if (firstItem === '+') {
      if (length >= 12) {
        this.sendSmsCode();
        this.step = 3;
      } else {
        title = 'El número de teléfono es muy corto';
        msg = 'Verifica que hayas incluido el código del país e intenta de nuevo';
        await this.alerts.presentAlertSimple(title, msg, 'Entiendo');
      }
    } else {
      title = 'Incluye el indicativo de país';
      msg = 'Comienza con el símbolo "+"';
      await this.alerts.presentAlertSimple(title, msg, 'Entiendo');
    }
  }

  async sendSmsCode() {
    this.codeSMS1 = this.utilities.createSmsCode();
    const msg = this.codeSMS1.toString() + ' es su código de verificación de Binarex';
    this.smsSend = true;
    this.step = 3;
    const resp = await this.utilities.sendSMS2(msg, this.fullUser.phoneNumber);
    console.log('sendMSg2 is ', resp);
    await this.alerts.presentToast('Código de confirmación enviado por SMS', 'dark', 5000);
    this.smsSend = false;
  }

  codeReady() {
    if (this.codeSMS2 && this.codeSMS2.toString().length === 6) {
      return false;
    } else {
      return true;
    }
  }

  async OtpVerification() {
    if (this.codeSMS1 === this.codeSMS2) {
      this.step = 4;
      this.initFullUser();
    } else {
      this.alerts.presentAlertSimple('Código inválido', 'Por favor verifícalo e intenta de nuevo', 'Entiendo');
      this.codeSMS2 = null;
    }
  }

  async afterLogin() {
    console.log('FullUser User', this.fullUser);
    await this.authService.createNewUser(this.fullUser);
    const msg = 'Nuevo usuario creado \n' + 'Nombre: ' + this.fullUser.displayName + '\n' + 'Id: ' + this.fullUser.uid;
    await this.utilities.sendTelegramMsg(msg, this.variables.telegramURL).subscribe(resp => resp);
    this.authService.subscribeUser(this.fullUser.uid);
    this.closeModal();
  }

  rejectTyC() {
    location.reload();
  }

  goBack() {
    this.step = this.step - 1;
    console.log(this.step);
    if (this.step === 1) {
      this.initAfAuth();
    }
  }

  logOut() {
    this.authService.logout();
  }

  closeModal() {
    this.modalController.dismiss();
  }

}

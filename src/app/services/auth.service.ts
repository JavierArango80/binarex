/* eslint-disable @typescript-eslint/member-ordering */
import { User } from './../interfaces/user';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import { first, take } from 'rxjs/operators';
import '@codetrix-studio/capacitor-google-auth';
// import { Plugins } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';

// const { Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userAuth: BehaviorSubject<any> = new BehaviorSubject(null);
  confirmationResult: firebase.auth.ConfirmationResult;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router
  ) {
/*     Plugins.GoogleAuth.init();
    this.getAuthUser().then(user => {
      if (user) {
        // console.log('Auth userId: ', user.uid);
        this.subscribeUser(user.uid);
      }
    }); */
  }

  public signInWithPhoneNumber(recaptchaVerifier, phoneNumber) {
    console.log('The phoneNumber is: ', phoneNumber);
    console.log('The captcha is ', recaptchaVerifier);
    return new Promise<any>((resolve, reject) => {
      this.afAuth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier).then((confirmationResult) => {
          this.confirmationResult = confirmationResult;
          resolve(confirmationResult);
        }).catch((error) => {
          console.log(error);
          resolve(error);
        });
    });
  }

  public async enterVerificationCode(code) {
    return new Promise<any>((resolve, reject) => {
      this.confirmationResult.confirm(code).then(async (result) => {
        console.log(result);
        const user = result.user;
        resolve(user);
      }).catch((error) => {
        resolve(error.message);
      });
    });
  }

  async getAuthUser(): Promise<any> {
    return this.afAuth.authState.pipe(first()).toPromise().then(user => user);
  }

  async getFireUser(userId: string): Promise<any> {
    return this.db.doc(`users/${userId}`)
      .valueChanges().pipe(take(1)).toPromise().then(user => user);
  }

  getUser() {
    return this.userAuth.asObservable();
  }

  async createNewUser(authUser: any): Promise<string> {
    await this.db.doc(`users/${authUser.uid}`).set(JSON.parse( JSON.stringify(authUser)), {merge: true});
    return authUser.uid;
  }

  subscribeUser(userId: string) {
    this.db.doc(`users/${userId}`).valueChanges().subscribe(userData => {
      // console.log('User form FireStore is: ', userData);
      this.userAuth.next(userData);
    });
  }

/*   async googleSignup() {
    return Plugins.GoogleAuth.signIn(null).then(async (resp: any) => {
      // console.log('resp google Auth: ', JSON.stringify(resp));
      if (resp.idToken) {
        return this.afAuth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(resp.idToken, null)).then( (resp2) => {
          // console.log('resp firebase: ', JSON.stringify(resp2));
          return true;
        }).catch((error) => {
          console.log('error firebase: ', JSON.stringify(error));
          alert('Ocurrio una falla en la autenticación, comunicate al +573176701364 para soporte');
          return false;
        });
      } else {
        // console.log(resp.authentication.accessToken);
        const credential = await firebase.auth.GoogleAuthProvider.credential(null, resp.authentication.accessToken);
        // console.log('credential: ',credential);
        return this.afAuth.signInWithCredential(credential).then( (resp2) => {
          // console.log(JSON.stringify(resp2));
          return true;
        }).catch(() => {
          alert('Ocurrio una falla en la autenticación, comunicate al +573176701364 para soporte');
          return false;
        });
      }
    });
  } */

  logout() {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/tabs/tab1']);
      location.reload();
    });
  }

}

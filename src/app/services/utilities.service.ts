import { Observable } from 'rxjs';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AngularFireFunctions } from '@angular/fire/functions';


@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {


  constructor(
    private http: HttpClient,
    private functions: AngularFireFunctions
  ) {  }


  removeDuplicates(array: any[]) {
    return array.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
  }

  sendTelegramMsg(msg: string, telegramUrl: string): Observable<any> {
    console.log('Telegram URL', telegramUrl);
    console.log('Telegram msg', msg);
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    const url = telegramUrl + encodeURIComponent(msg);
    console.log(url);
    return this.http.post(url, '', {headers});
  }

/*   sendTelegramMsg(msg: string, telegramUrl: string): Promise<any> {
    console.log('Telegram URL', telegramUrl);
    console.log('Telegram msg', msg);
    const callable = this.functions.httpsCallable('api1');
    const obs = callable({msg});
    obs.subscribe(async res => {
      const alert = await this.alertController.create({
        header: `Time: ${res.date}`,
        message: res.msg,
        buttons: ['OK']
      });
      await alert.present();
    });
    return obs.toPromise().then(resp => resp);
  } */

  get windowRef() {
    return window;
  }

  sendSMS(msg: string, phoneNumber: string) {
    return this.http.post(`${environment.urlCloudFunctions}/api1/SendSMS/${phoneNumber}/${msg}`, {});
  }

  sendSMS2(msg: string, phoneNumber: string): Promise<any> {
    const callable = this.functions.httpsCallable('twilioSMS');
    const obs = callable({msg, phoneNumber});
    return obs.toPromise().then(resp => resp);
  }


  createSmsCode() {
    return Math.floor(100000 + Math.random() * 900000);
  }

}

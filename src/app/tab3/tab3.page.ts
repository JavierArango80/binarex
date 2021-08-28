import { AuthService } from './../services/auth.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireUploadTask, AngularFireStorage } from '@angular/fire/storage';
import { Observable, Subscription } from 'rxjs';
import { finalize, take, tap } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { FirestoreService } from '../services/firestore.service';
import { User } from '../interfaces/user';
import { UserBanksComponent } from '../components/user-banks/user-banks.component';
const { version: appVersion } = require('../../../package.json');

export interface MyData {
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit, OnDestroy {

  appVersion: string;
  user: User;
  task: AngularFireUploadTask;
  percentage: Observable<number>;
  snapshot: Observable<any>;
  uploadedFileUrl: Observable<string>;
  images: Observable<MyData[]>;
  fileName: string;
  fileSize: number;
  isUploading: boolean;
  isUploaded: boolean;
  private subscriptionUser: Subscription;

  constructor(
    private fire: FirestoreService,
    private storage: AngularFireStorage,
    public modalController: ModalController,
    private auth: AuthService
  ) { }

  async ngOnInit() {
    this.appVersion = appVersion;
    this.subscriptionUser = this.fire.getUserObservable().subscribe(user => {
      this.user = user;
      console.log('User from tab3: ', this.user);
    });
  }

  uploadFile(event: any) {
    console.log(event);

    // The File object
    const file = event.item(0);

    // Validation for Images Only
    if (file.type.split('/')[0] !== 'image') {
     console.error('unsupported file type :( ');
     return;
    }

    this.isUploading = true;
    this.isUploaded = false;
    this.fileName = file.name;
    const path = `userPhotos/${new Date().getTime()}_${file.name}`;
    const customMetadata = { app: 'Image Upload Demo' };
    const fileRef = this.storage.ref(path);
    this.task = this.storage.upload(path, file, { customMetadata });
    this.percentage = this.task.percentageChanges();
    this.snapshot = this.task.snapshotChanges().pipe(

      finalize(() => {
        // Get uploaded file storage path
        this.uploadedFileUrl = fileRef.getDownloadURL();

        this.uploadedFileUrl.pipe(take(1)).subscribe(resp => {
          console.log('finish ', resp);
          this.user.photoURL = resp;
          this.isUploading = false;
          this.isUploaded = true;
        }, error => {
          console.error(error);
        });
      }),
      tap(snap => {
          this.fileSize = snap.totalBytes;
      })
    );
  }

  async saveProfile() {
    const resp = await this.fire.createUser(this.user);
    console.log(resp);
    // window.location.reload();
  }

  async openBanks() {
    const popover = await this.modalController.create({
      component: UserBanksComponent,
      cssClass: 'dialog-modal',
      componentProps: {
        edit: false
      }
    });
    await popover.present();
    await popover.onDidDismiss().then((data) => {
      if (data.data) {
        // this.transaction.bank = data.data;
        // this.bank = data.data.bank + ' ****' + data.data.last4;
      }
    });
  }

  logout() {
    this.auth.logout();
  }

  ngOnDestroy() {
    if (this.subscriptionUser) {
      this.subscriptionUser.unsubscribe();
    }
  }

}


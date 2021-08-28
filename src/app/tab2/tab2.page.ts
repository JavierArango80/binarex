import { AngularFireUploadTask, AngularFireStorage } from '@angular/fire/storage';
import { Transaction } from './../interfaces/transaction';
import { FirestoreService } from './../services/firestore.service';
import { User } from './../interfaces/user';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { usdtPrice } from '../services/firestore.service';
import { tap, take, finalize } from 'rxjs/operators';

export interface MyData {
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {

  usdt: Observable<usdtPrice>;
  fullUser: User;
  private subscriptionUser: Subscription;
  private subscriptionDepositsUser: Subscription;
  private subscriptionWithdrawsUser: Subscription;
  deposits: Transaction[];
  withdraws: Transaction[];
  variables: any;
  fileName: string;
  fileSize: number;
  isUploading: boolean;
  isUploaded: boolean;
  task: AngularFireUploadTask;
  percentage: Observable<number>;
  snapshot: Observable<any>;
  uploadedFileUrl: Observable<string>;
  images: Observable<MyData[]>;

  constructor(
    private fire: FirestoreService,
    private storage: AngularFireStorage
  ) {
    this.usdt =  this.fire.getUsdtObservable();
  }

  async ngOnInit() {
    this.variables = await this.fire.getVariables();
    this.subscriptionUser = this.fire.getUserObservable().subscribe(user => {
      this.fullUser = user;
      if (this.fullUser && !this.subscriptionDepositsUser) {
        this.subscriptionDepositsUser = this.fire.getDepositsUser(this.fullUser.uid).subscribe(items => {
          this.deposits = items;
          console.log('Deposits ', items);
          this.deposits = this.removeDuplicates(this.deposits);
        });
      }
      if (this.fullUser && !this.subscriptionWithdrawsUser) {
        this.subscriptionWithdrawsUser = this.fire.getWithdrawsUser(this.fullUser.uid).subscribe(items => {
          this.withdraws = items;
          console.log('Withdraws ', items);
          this.withdraws = this.removeDuplicates(this.withdraws);
        });
      }
    });
    this.checkTime();
  }

  checkTime() {
    setInterval(() => {
      if(this.deposits) {
        this.deposits.map(async deposit => {
          if (deposit.timeUntil2 <= Date.now() && deposit.status === 'Pendiente' && !deposit.timeDeposit) {
            deposit.status = 'Rechazado';
            const timeInit = Date.now();
            deposit.timeDeposit = new Date(timeInit);
            const resp = await this.fire.editDepositUser(this.fullUser.uid, deposit);
            console.log('Transaccion expirada: ', resp);
          }
        });
      }
    }, 1000);
  }

  removeDuplicates(array: any[]) {
    return array.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
  }

  async submitVoucher(item: any) {
    item.status = 'successful';

  }

  uploadFile(event: FileList, item: Transaction) {
    // console.log(item);
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
    const path = `BankReceipts/${new Date().getTime()}_${file.name}`;
    const customMetadata = { app: 'Image Upload Demo' };
    const fileRef = this.storage.ref(path);
    this.task = this.storage.upload(path, file, { customMetadata });
    this.percentage = this.task.percentageChanges();
    this.snapshot = this.task.snapshotChanges().pipe(

      finalize(() => {
        // Get uploaded file storage path
        this.uploadedFileUrl = fileRef.getDownloadURL();

        this.uploadedFileUrl.pipe(take(1)).subscribe(async resp => {
          console.log('finish ', resp);
          item.photoURL = resp;
          this.isUploading = false;
          this.isUploaded = true;
          console.log('Mis recibos', this.deposits);
          item.timeDeposit = new Date(Date.now());
          const resp2 = await this.fire.editDepositUser(this.fullUser.uid, item);
          console.log('Comprobante cargado: ', resp2);
          location.reload();
        }, error => {
          console.error(error);
        });
      }),
      tap(snap => {
          this.fileSize = snap.totalBytes;
      })
    );
  }

  getColor(item: string) {
    if (item === 'Rechazado') {
      return 'var(--ion-color-danger)';
    } else  if (item === 'Pendiente') {
      return 'var(--ion-color-primary)';
    } else if (item === 'Aprobado') {
      return 'var(--ion-color-success)';
    } else {
      return 'transparent';
    }
  }

  ngOnDestroy() {
    if (this.subscriptionUser) {
      this.subscriptionUser.unsubscribe();
    }
    if (this.subscriptionDepositsUser) {
      this.subscriptionDepositsUser.unsubscribe();
    }
  }

}

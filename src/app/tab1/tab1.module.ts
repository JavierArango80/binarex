import { NewPaymentMethodComponent } from './../components/new-payment-method/new-payment-method.component';
import { UserBanksComponent } from './../components/user-banks/user-banks.component';
import { WithdrawComponent } from './../components/withdraw/withdraw.component';
import { DepositComponent } from './../components/deposit/deposit.component';
import { ComponentsModule } from './../components/components.module';
// import { CustomHeaderComponent } from './../components/custom-header/custom-header.component';
import { BuyComponent } from './../components/buy/buy.component';
import { AdminModuloComponent } from './../components/admin-modulo/admin-modulo.component';
import { ConfirmInvestComponent } from './../components/confirm-invest/confirm-invest.component';
import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { Tab1PageRoutingModule } from './tab1-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab1PageRoutingModule,
    ComponentsModule
  ],
  declarations: [
    Tab1Page,
    ConfirmInvestComponent,
    AdminModuloComponent,
    BuyComponent,
    DepositComponent,
    WithdrawComponent,
    UserBanksComponent,
    NewPaymentMethodComponent
  ],
  entryComponents: [
    ConfirmInvestComponent,
    AdminModuloComponent,
    BuyComponent,
    DepositComponent,
    WithdrawComponent,
    UserBanksComponent,
    NewPaymentMethodComponent
  ]
})
export class Tab1PageModule {}

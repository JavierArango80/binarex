import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CustomHeaderComponent } from './custom-header/custom-header.component';
import { NgModule } from '@angular/core';


@NgModule({
  declarations: [
    CustomHeaderComponent
  ],
  exports: [
    CustomHeaderComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  entryComponents: [

  ]
})
export class ComponentsModule { }

import { NgModule } from '@angular/core';
import { FileSizeFormatPipe } from './file-size';

@NgModule({
  declarations:
  [
  FileSizeFormatPipe
],
  exports: [
    FileSizeFormatPipe
   ]
})
export class PipesModule { }

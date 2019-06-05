import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabarComponent } from './databar.component';

@NgModule({
  declarations: [DatabarComponent],
  imports: [
    CommonModule
  ],
  exports: [DatabarComponent]
})
export class DatabarModule { }

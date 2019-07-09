import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DatabarModule } from './databar/databar.module';
import { DataLoaderModule } from './data-loader/data-loader.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DatabarModule,
    DataLoaderModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

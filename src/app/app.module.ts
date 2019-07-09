import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
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
    HttpClientModule,
    AppRoutingModule,
    DatabarModule,
    DataLoaderModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

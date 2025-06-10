import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import { RegisterComponent } from './pages/register/register.component';
// import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './pages/main-layout/main-layout.component';
import { CustomerComponent } from './pages/master/customer/customer.component';
import { SupplierComponent } from './pages/master/supplier/supplier.component';
import { ItemComponent } from './pages/master/item/item.component';
// import { TransactionComponent } from './pages/transaction/transaction.component';
import { ReportComponent } from './pages/report/report.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
// import { InvertComponent } from './pages/transection/invert/invert.component';
// import { OutvertComponent } from './pages/transection/outvert/outvert.component';
import { InvertFormComponent } from './pages/transection/invert/invert-form/invert-form.component';
import { InvertListComponent } from './pages/transection/invert/invert-list/invert-list.component';
import { OutvertFormComponent } from './pages/transection/outvert/outvert-form/outvert-form.component';
import { OutvertListComponent } from './pages/transection/outvert/outvert-list/outvert-list.component';
import { TransectionReportComponent } from './pages/report/transection-report/transection-report.component';
import { AuthComponent } from './pages/auth/auth.component';
import { InwerdRegisterComponent } from './pages/report/inwerd-register/inwerd-register.component';
import { OutwerdRegisterComponent } from './pages/report/outwerd-register/outwerd-register.component';
@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    // RegisterComponent,
    //    LoginComponent,
    MainLayoutComponent,
    CustomerComponent,
    SupplierComponent,
    ItemComponent,
    ReportComponent,
    DashboardComponent,
    //  InvertComponent,
    //  OutvertComponent,
    InvertFormComponent,
    InvertListComponent,
    OutvertFormComponent,
    OutvertListComponent,
    TransectionReportComponent,
    InwerdRegisterComponent,
    OutwerdRegisterComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    provideClientHydration(withEventReplay())
    provideHttpClient(withFetch()),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

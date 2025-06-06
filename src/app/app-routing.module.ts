import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { LoginComponent } from './pages/login/login.component';
// import { RegisterComponent } from './pages/register/register.component';
import { MainLayoutComponent } from './pages/main-layout/main-layout.component';
import { CustomerComponent } from './pages/master/customer/customer.component';
import { SupplierComponent } from './pages/master/supplier/supplier.component';
import { ItemComponent } from './pages/master/item/item.component';
import { AuthComponent } from './pages/auth/auth.component';


import { ReportComponent } from './pages/report/report.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
// import { OutvertComponent } from './pages/transection/outvert/outvert.component';
import { InvertFormComponent } from './pages/transection/invert/invert-form/invert-form.component';
import { InvertListComponent } from './pages/transection/invert/invert-list/invert-list.component';
import { OutvertFormComponent } from './pages/transection/outvert/outvert-form/outvert-form.component';
import { OutvertListComponent } from './pages/transection/outvert/outvert-list/outvert-list.component';
import { TransectionReportComponent } from './pages/report/transection-report/transection-report.component';
import { InwerdRegisterComponent } from './pages/report/inwerd-register/inwerd-register.component';
import { OutwerdRegisterComponent } from './pages/report/outwerd-register/outwerd-register.component';
const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  // { path: 'register', component: RegisterComponent },
  // { path: 'login', component: LoginComponent },
  {
    path: 'main',
    component: MainLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'master/customer', component: CustomerComponent },
      { path: 'master/supplier', component: SupplierComponent },
      { path: 'master/item', component: ItemComponent },
      // { path: 'transaction/invert', component: InvertComponent },
      { path: 'transaction/outvert', component: OutvertListComponent },
      {
        path: 'transaction/invert',
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          { path: 'list', component: InvertListComponent },
          { path: 'form', component: InvertFormComponent },
        ]
      },
      {
        path: 'transaction/outvert',
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          { path: 'list', component: OutvertListComponent },
          { path: 'form', component: OutvertFormComponent }
        ]
      },
      {
        path: 'report',
        children: [
          { path: '', component: TransectionReportComponent },
          { path: 'inwerd-register', component: InwerdRegisterComponent },
          { path: 'outwerd-register', component: OutwerdRegisterComponent }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

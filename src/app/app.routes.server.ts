import { RenderMode, ServerRoute } from '@angular/ssr';
import { CustomerComponent } from './pages/master/customer/customer.component';
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];

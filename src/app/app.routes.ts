import { Routes } from '@angular/router';
import { AdminImportComponent } from './components/admin-import/admin-import.component';
import { AreaPageComponent } from './components/area-page/area-page.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'area/:id', component: AreaPageComponent },
  { path: 'admin-import', component: AdminImportComponent },
  { path: '**', redirectTo: '' },
];

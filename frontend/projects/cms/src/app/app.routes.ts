import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ProgramFormComponent } from './components/program-form/program-form';
import { ProgramDetailComponent } from './components/program-detail/program-detail';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AdminGuard]
  },
  { 
    path: 'programs/new', 
    component: ProgramFormComponent,
    canActivate: [AdminGuard]
  },
  { 
    path: 'programs/:id/edit', 
    component: ProgramFormComponent,
    canActivate: [AdminGuard]
  },
  { 
    path: 'programs/:id/view', 
    component: ProgramDetailComponent,
    canActivate: [AdminGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];

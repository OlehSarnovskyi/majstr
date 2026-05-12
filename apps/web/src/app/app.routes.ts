import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { masterProfileGuard, noProfileGuard } from './core/guards/master-profile.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth/login',
    canActivate: [guestGuard], // TODO: guestGuard not working reliably — investigate whenReady timing

    loadComponent: () =>
      import('./pages/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'auth/choose-role',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/auth/choose-role/choose-role.component').then(
        (m) => m.ChooseRoleComponent
      ),
  },
  {
    path: 'auth/create-profile',
    canActivate: [noProfileGuard],
    loadComponent: () =>
      import('./pages/auth/create-profile/create-profile.component').then(
        (m) => m.CreateProfileComponent
      ),
  },
  {
    path: 'auth/forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'auth/reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'auth/verify-email',
    loadComponent: () =>
      import('./pages/auth/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent
      ),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth/callback/callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories.component').then(
        (m) => m.CategoriesComponent
      ),
  },
  {
    path: 'categories/:slug',
    loadComponent: () =>
      import('./pages/category-detail/category-detail.component').then(
        (m) => m.CategoryDetailComponent
      ),
  },
  {
    path: 'masters',
    loadComponent: () =>
      import('./pages/masters/masters.component').then(
        (m) => m.MastersComponent
      ),
  },
  {
    path: 'masters/:id',
    loadComponent: () =>
      import('./pages/master-profile/master-profile.component').then(
        (m) => m.MasterProfileComponent
      ),
  },
  {
    path: 'booking/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/booking/booking.component').then(
        (m) => m.BookingComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, masterProfileGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/legal/privacy.component').then(
        (m) => m.PrivacyComponent
      ),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pages/legal/terms.component').then(
        (m) => m.TermsComponent
      ),
  },
  {
    path: 'cookies',
    loadComponent: () =>
      import('./pages/legal/cookies.component').then(
        (m) => m.CookiesComponent
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];

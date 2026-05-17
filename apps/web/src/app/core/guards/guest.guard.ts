import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady;

  if (auth.isLoggedIn()) {
    // If role not yet chosen, send to choose-role instead of dashboard
    if (auth.user()?.roleChosen === false) {
      return router.createUrlTree(['/auth/choose-role']);
    }
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

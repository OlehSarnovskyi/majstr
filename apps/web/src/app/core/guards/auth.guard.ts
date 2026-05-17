import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady;

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  // Redirect to role selection if the user hasn't chosen a role yet.
  // Skip this check when the target IS choose-role (avoids infinite redirect loop).
  if (auth.user()?.roleChosen === false && state.url !== '/auth/choose-role') {
    return router.createUrlTree(['/auth/choose-role']);
  }

  return true;
};

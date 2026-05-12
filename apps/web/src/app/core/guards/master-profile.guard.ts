import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

/**
 * Blocks access to any route until a MASTER user has created their profile.
 * Non-MASTER users pass through immediately.
 *
 * Usage: add to routes that masters can only reach after completing their profile
 * (e.g. dashboard). Also used in reverse: the create-profile route uses
 * `noProfileGuard` to redirect masters who already have a profile.
 */
export const masterProfileGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  await auth.whenReady;

  // Only enforce for MASTER users
  if (!auth.isMaster()) return true;

  try {
    const profile = await firstValueFrom(api.getMyMasterProfile());
    if (profile) return true;
  } catch {
    // network error — let the user through; backend will guard anyway
    return true;
  }

  return router.createUrlTree(['/auth/create-profile']);
};

/**
 * Redirects a MASTER who already has a profile away from the create-profile page.
 */
export const noProfileGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  await auth.whenReady;

  if (!auth.isLoggedIn()) return router.createUrlTree(['/auth/login']);
  if (!auth.isMaster())   return router.createUrlTree(['/dashboard']);

  try {
    const profile = await firstValueFrom(api.getMyMasterProfile());
    if (profile) return router.createUrlTree(['/dashboard']);
  } catch {
    // network error — allow through
  }

  return true;
};

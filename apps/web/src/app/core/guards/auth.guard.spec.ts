import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
  provideRouter,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * Helper that runs the guard inside TestBed's injection context.
 * Returns unknown because CanActivateFn can return Observable | Promise | boolean | UrlTree.
 * Our guard is async so it resolves to boolean | UrlTree at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runGuard(): Promise<any> {
  return TestBed.runInInjectionContext(() =>
    authGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot
    )
  );
}

describe('authGuard', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('when user is NOT logged in', () => {
    it('should return a UrlTree that redirects to /auth/login', async () => {
      // No token in localStorage → no /api/auth/me request
      const result = await runGuard();

      expect(result).toBeInstanceOf(UrlTree);
      const urlTree = result as UrlTree;
      expect(router.serializeUrl(urlTree)).toBe('/auth/login');
    });

    it('should not return true', async () => {
      const result = await runGuard();
      expect(result).not.toBe(true);
    });
  });

  describe('when user IS logged in', () => {
    it('should return true and allow navigation', async () => {
      // Simulate being logged in by pre-populating the user signal via login
      const auth = TestBed.inject(AuthService);

      // Trigger login to populate currentUser signal
      auth.login({ email: 'user@example.com', password: 'password123' }).subscribe();
      httpMock
        .expectOne('/api/auth/login')
        .flush({
          accessToken: 'valid-token',
          user: {
            id: 'u1',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'CLIENT',
            roleChosen: true,
          },
        });

      // Wait a tick for the tap() handler to run
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const result = await runGuard();
      expect(result).toBe(true);
    });
  });

  describe('whenReady integration', () => {
    it('should wait for whenReady before checking isLoggedIn', async () => {
      // No token → whenReady resolves immediately → not logged in
      const auth = TestBed.inject(AuthService);
      await auth.whenReady;

      const result = await runGuard();
      expect(result).toBeInstanceOf(UrlTree);
    });

    it('should redirect even if called before auth state resolves', async () => {
      // Guard must await whenReady, so the redirect still happens correctly
      const resultPromise = runGuard();
      const result = await resultPromise;

      expect(result).toBeInstanceOf(UrlTree);
      const tree = result as UrlTree;
      expect(router.serializeUrl(tree)).toBe('/auth/login');
    });
  });
});

import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthResponse, User } from './auth.service';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'CLIENT',
  roleChosen: true,
};

const mockAuthResponse: AuthResponse = {
  accessToken: 'mock-jwt-token',
  user: mockUser,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

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

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    // No token in localStorage → no /api/auth/me request on construction
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('isLoggedIn should be false when no token in storage', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('user signal should be null initially', () => {
      expect(service.user()).toBeNull();
    });
  });

  describe('login', () => {
    it('should set accessToken in localStorage and update user signal on success', async () => {
      const resultPromise = firstValueFrom(
        service.login({ email: 'test@example.com', password: 'password123' })
      );

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
      req.flush(mockAuthResponse);

      const result = await resultPromise;

      expect(result).toEqual(mockAuthResponse);
      expect(localStorage.getItem('accessToken')).toBe('mock-jwt-token');
      expect(service.user()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should propagate HTTP error on login failure', async () => {
      const resultPromise = firstValueFrom(
        service.login({ email: 'test@example.com', password: 'wrong' })
      ).catch((err) => ({ error: err }));

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(
        { message: 'Invalid credentials' },
        { status: 401, statusText: 'Unauthorized' }
      );

      const outcome = await resultPromise;
      expect(outcome).toHaveProperty('error');
      expect(service.isLoggedIn()).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('register', () => {
    it('should POST to /api/auth/register and return a message (no token issued until email verified)', async () => {
      const mockResponse = { message: 'Registration successful. Please check your email to verify your account.', email: 'new@example.com' };
      const resultPromise = firstValueFrom(
        service.register({
          email: 'new@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Smith',
        })
      );

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      // No token is stored — user must verify email first
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(service.user()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should remove accessToken and clear user signal', async () => {
      // First log in
      const loginPromise = firstValueFrom(
        service.login({ email: 'test@example.com', password: 'password123' })
      );
      httpMock.expectOne('/api/auth/login').flush(mockAuthResponse);
      await loginPromise;

      expect(service.isLoggedIn()).toBe(true);

      service.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should still work when not logged in (no error thrown)', () => {
      expect(() => service.logout()).not.toThrow();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('isLoggedIn signal', () => {
    it('should return false before login', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true after successful login', async () => {
      const loginPromise = firstValueFrom(
        service.login({ email: 'test@example.com', password: 'password123' })
      );
      httpMock.expectOne('/api/auth/login').flush(mockAuthResponse);
      await loginPromise;

      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false after logout', async () => {
      const loginPromise = firstValueFrom(
        service.login({ email: 'test@example.com', password: 'password123' })
      );
      httpMock.expectOne('/api/auth/login').flush(mockAuthResponse);
      await loginPromise;

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('isMaster signal', () => {
    it('should return false for CLIENT role', async () => {
      const loginPromise = firstValueFrom(
        service.login({ email: 'test@example.com', password: 'password123' })
      );
      httpMock.expectOne('/api/auth/login').flush(mockAuthResponse);
      await loginPromise;

      expect(service.isMaster()).toBe(false);
    });

    it('should return true for MASTER role', async () => {
      const masterResponse: AuthResponse = {
        accessToken: 'master-token',
        user: { ...mockUser, role: 'MASTER' },
      };

      const loginPromise = firstValueFrom(
        service.login({ email: 'master@example.com', password: 'password123' })
      );
      httpMock.expectOne('/api/auth/login').flush(masterResponse);
      await loginPromise;

      expect(service.isMaster()).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    it('should POST to /api/auth/forgot-password with the email', async () => {
      const resultPromise = firstValueFrom(
        service.forgotPassword('test@example.com')
      );

      const req = httpMock.expectOne('/api/auth/forgot-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com' });
      req.flush({ message: 'If this email exists, a reset link has been sent' });

      const result = await resultPromise;
      expect(result).toEqual({
        message: 'If this email exists, a reset link has been sent',
      });
    });

    it('should return success response even for non-existent email', async () => {
      const resultPromise = firstValueFrom(
        service.forgotPassword('nobody@example.com')
      );

      const req = httpMock.expectOne('/api/auth/forgot-password');
      req.flush({ message: 'If this email exists, a reset link has been sent' });

      const result = await resultPromise;
      expect(result?.message).toContain('reset link');
    });
  });

  describe('whenReady', () => {
    it('should resolve immediately when no token is present', async () => {
      localStorage.removeItem('accessToken');
      const freshService = TestBed.runInInjectionContext(() => new AuthService());
      await expect(freshService.whenReady).resolves.toBeUndefined();
    });
  });
});

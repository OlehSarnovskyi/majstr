import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

function createMockAuthService(overrides: Partial<AuthService> = {}) {
  return {
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    ...overrides,
  } as unknown as AuthService;
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = createMockAuthService();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([
          { path: 'dashboard', component: LoginComponent },
          { path: 'auth/forgot-password', component: LoginComponent },
          { path: 'auth/register', component: LoginComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation on empty submit', () => {
    it('should show email error when email is empty after submit', () => {
      component.email = '';
      component.password = '';

      component.onSubmit();
      fixture.detectChanges();

      expect(component.emailError).toBe('E-mail je povinný');
    });

    it('should show password error when password is empty after submit', () => {
      component.email = 'valid@example.com';
      component.password = '';

      component.onSubmit();
      fixture.detectChanges();

      expect(component.passwordError).toBe('Heslo je povinné');
    });

    it('should show email format error when email has no @', () => {
      component.email = 'notanemail';
      component.password = 'password123';

      component.onSubmit();
      fixture.detectChanges();

      expect(component.emailError).toBe('Zadajte platný e-mail');
    });

    it('should not call authService.login when form is invalid', () => {
      component.email = '';
      component.password = '';

      component.onSubmit();

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should not show validation errors before submit', () => {
      component.email = '';
      component.password = '';
      // submitted defaults to false

      expect(component.emailError).toBe('');
      expect(component.passwordError).toBe('');
    });

    it('should show both email and password errors simultaneously', () => {
      component.email = '';
      component.password = '';

      component.onSubmit();
      fixture.detectChanges();

      expect(component.emailError).toBeTruthy();
      expect(component.passwordError).toBeTruthy();
    });
  });

  describe('wrong credentials', () => {
    it('should display Slovak error message on 401 Invalid credentials', async () => {
      const subject = new Subject<never>();
      vi.mocked(mockAuthService.login).mockReturnValue(subject.asObservable());

      component.email = 'user@example.com';
      component.password = 'wrongpassword';
      component.onSubmit();

      subject.error({ error: { message: 'Invalid credentials' }, status: 401 });
      fixture.detectChanges();

      expect(component.error()).toBe('Nesprávny e-mail alebo heslo');
      expect(component.loading()).toBe(false);
    });

    it('should display generic Slovak error for other login errors', async () => {
      const subject = new Subject<never>();
      vi.mocked(mockAuthService.login).mockReturnValue(subject.asObservable());

      component.email = 'user@example.com';
      component.password = 'somepassword';
      component.onSubmit();

      subject.error({ error: { message: 'Server error' }, status: 500 });
      fixture.detectChanges();

      expect(component.error()).toBe('Prihlásenie zlyhalo');
      expect(component.loading()).toBe(false);
    });

    it('should set loading to true while request is in flight', () => {
      // Use a Subject that never completes to simulate an in-flight request
      const subject = new Subject<never>();
      vi.mocked(mockAuthService.login).mockReturnValue(subject.asObservable());

      component.email = 'user@example.com';
      component.password = 'somepassword';
      component.onSubmit();

      // loading should be true while the observable is pending
      expect(component.loading()).toBe(true);
    });
  });

  describe('successful login', () => {
    it('should navigate to /dashboard on success', async () => {
      const mockResponse = {
        accessToken: 'token',
        user: {
          id: '1',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CLIENT',
          roleChosen: true,
        },
      };
      vi.mocked(mockAuthService.login).mockReturnValue(of(mockResponse));
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.email = 'user@example.com';
      component.password = 'correctpassword';
      component.onSubmit();

      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should clear error signal on new submit attempt', () => {
      // First, trigger an error
      const errorSubject = new Subject<never>();
      vi.mocked(mockAuthService.login).mockReturnValue(errorSubject.asObservable());
      component.email = 'user@example.com';
      component.password = 'wrong';
      component.onSubmit();
      errorSubject.error({
        error: { message: 'Invalid credentials' },
        status: 401,
      });
      expect(component.error()).toBeTruthy();

      // Second attempt — success
      vi.mocked(mockAuthService.login).mockReturnValue(
        of({
          accessToken: 'token',
          user: {
            id: '1',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'CLIENT',
            roleChosen: true,
          },
        })
      );
      component.onSubmit();

      expect(component.error()).toBe('');
    });
  });

  describe('template rendering', () => {
    it('should render email and password input fields', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.querySelector('#login-email')).toBeTruthy();
      expect(compiled.querySelector('#login-password')).toBeTruthy();
    });

    it('should show error element in DOM when error signal is set', () => {
      component.error.set('Some error');
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.auth-card__error');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('Some error');
    });

    it('should not show error element when error is empty', () => {
      component.error.set('');
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.auth-card__error');
      expect(errorEl).toBeNull();
    });

    it('should show field-level email error in DOM after invalid submit', () => {
      component.email = '';
      component.onSubmit();
      fixture.detectChanges();

      const errorSpans = fixture.nativeElement.querySelectorAll('.form-field__error');
      const emailErrorEl = Array.from(errorSpans).find((el) =>
        (el as HTMLElement).textContent?.includes('E-mail je povinný')
      );
      expect(emailErrorEl).toBeTruthy();
    });
  });
});

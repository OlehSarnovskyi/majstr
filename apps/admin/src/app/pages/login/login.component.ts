import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__logo">
          <h1>🔧 Majster Admin</h1>
          <p>Sign in to the admin panel</p>
        </div>

        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="admin@example.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            style="width: 100%; margin-bottom: 12px"
            [disabled]="loading()"
          >
            {{ loading() ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <div class="divider">
          <span>or</span>
        </div>

        <button class="btn btn-google" (click)="loginWithGoogle()">
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  `,
  styles: [`
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0 12px;
      color: var(--color-text-muted);
      font-size: 0.875rem;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--color-border);
      }
    }
    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 11px 24px;
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-family);
      font-size: 0.938rem;
      font-weight: 500;
      color: var(--color-text);
      cursor: pointer;
      transition: background 0.2s, box-shadow 0.2s;

      &:hover {
        background: #f8fafc;
        box-shadow: var(--shadow-sm);
      }
    }
  `],
})
export class LoginComponent implements OnInit {
  private authService = inject(AdminAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'not_admin') {
      this.errorMessage.set('Access denied: this Google account is not an admin.');
    } else if (error === 'auth_failed' || error === 'oauth_error') {
      this.errorMessage.set('Google sign-in failed. Please try again.');
    }
  }

  loginWithGoogle(): void {
    window.location.href = '/api/auth/google?origin=admin';
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.message === 'Not an admin') {
          this.errorMessage.set('Access denied: this account is not an admin.');
        } else if (err?.status === 401) {
          this.errorMessage.set('Invalid email or password.');
        } else {
          this.errorMessage.set('An error occurred. Please try again.');
        }
      },
    });
  }
}

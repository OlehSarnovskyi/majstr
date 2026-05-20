import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__logo">
          <span class="login-card__icon">🔧</span>
          <h1>Majstr Admin</h1>
          <p class="login-card__subtitle">Sign in with your Google account to continue</p>
        </div>

        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }

        <button class="btn-google" (click)="loginWithGoogle()">
          <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p class="login-card__note">Only approved admin accounts can access this panel.</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F1F5F9;
    }

    .login-card {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 48px 40px 40px;
      width: 100%;
      max-width: 380px;
      text-align: center;

      &__icon {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 12px;
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 8px;
      }

      &__subtitle {
        font-size: 0.875rem;
        color: #64748B;
        margin-bottom: 32px;
      }

      &__note {
        margin-top: 20px;
        font-size: 0.75rem;
        color: #94A3B8;
      }
    }

    .error-message {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #DC2626;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 20px;
      text-align: left;
    }

    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 24px;
      background: #fff;
      border: 1.5px solid #E2E8F0;
      border-radius: 10px;
      font-size: 0.938rem;
      font-weight: 500;
      color: #1E293B;
      cursor: pointer;
      transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;

      &:hover {
        background: #F8FAFC;
        border-color: #CBD5E1;
        box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      }
    }
  `],
})
export class LoginComponent implements OnInit {
  private route = inject(ActivatedRoute);

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
}

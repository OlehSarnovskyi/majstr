import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  standalone: true,
  selector: 'app-auth-callback',
  template: `
    <div class="callback-container">
      @if (error) {
        <p class="error">{{ error }}</p>
      } @else {
        <p>Signing in…</p>
      }
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: var(--font-family);
      color: var(--color-text);
    }
    .error { color: var(--color-error); }
  `],
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AdminAuthService);

  error: string | null = null;

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.error = 'Missing auth code';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    this.http.post<{ accessToken: string; isNewUser: boolean }>(
      '/api/auth/exchange-code',
      { code }
    ).subscribe({
      next: (res) => this.authService.handleOAuthToken(res.accessToken, this.router),
      error: () => {
        this.error = 'Authentication failed';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
    });
  }
}

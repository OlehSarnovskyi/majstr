import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: '<div class="auth-page"><p>Prihlasovanie...</p></div>',
  styles: ['.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; }'],
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  async ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!code) {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
      return;
    }

    let isNew = false;
    try {
      const result = await firstValueFrom(this.auth.exchangeOAuthCode(code));
      this.auth.handleGoogleCallback(result.accessToken);
      isNew = result.isNewUser;
    } catch {
      this.router.navigate(['/auth/login'], {
        replaceUrl: true,
        queryParams: { error: 'oauth_error' },
      });
      return;
    }

    await this.auth.whenReady;

    const user = this.auth.user();
    const destination = (isNew || (user && !user.roleChosen))
      ? '/auth/choose-role'
      : '/dashboard';

    this.router.navigate([destination], { replaceUrl: true });
  }
}

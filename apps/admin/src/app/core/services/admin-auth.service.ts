import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<AdminUser | null>(this.loadUser());

  private loadUser(): AdminUser | null {
    try {
      return JSON.parse(localStorage.getItem('admin_user') ?? 'null');
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<{ accessToken: string; user: AdminUser }> {
    return this.http
      .post<{ accessToken: string; user: AdminUser }>('/api/auth/login', { email, password })
      .pipe(
        tap((res) => {
          if (res.user.role !== 'ADMIN') {
            throw new Error('Not an admin');
          }
          this.storeSession(res.accessToken, res.user);
        }),
      );
  }

  /** Called after Google OAuth code exchange — fetches /auth/me to get full user data */
  handleOAuthToken(accessToken: string, router: Router): void {
    // Temporarily store the token so the interceptor can attach it to the /me request
    localStorage.setItem('admin_token', accessToken);

    this.http.get<AdminUser>('/api/auth/me').subscribe({
      next: (user) => {
        if (user.role !== 'ADMIN') {
          localStorage.removeItem('admin_token');
          router.navigate(['/login'], { queryParams: { error: 'not_admin' } });
          return;
        }
        this.storeSession(accessToken, user);
        router.navigate(['/']);
      },
      error: () => {
        localStorage.removeItem('admin_token');
        router.navigate(['/login'], { queryParams: { error: 'auth_failed' } });
      },
    });
  }

  private storeSession(accessToken: string, user: AdminUser): void {
    localStorage.setItem('admin_token', accessToken);
    localStorage.setItem('admin_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser();
  }
}

import { Component, inject } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../core/services/admin-auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <h2>🔧 Majster Admin</h2>
          <span>admin.majster.sk</span>
        </div>

        <nav class="sidebar__nav">
          <div class="sidebar__nav-label">Main</div>

          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="sidebar__link"
          >
            <span class="nav-icon">📊</span>
            Dashboard
          </a>

          <a routerLink="/users" routerLinkActive="active" class="sidebar__link">
            <span class="nav-icon">👥</span>
            Users
          </a>

          <a routerLink="/bookings" routerLinkActive="active" class="sidebar__link">
            <span class="nav-icon">📅</span>
            Bookings
          </a>

          <a routerLink="/reviews" routerLinkActive="active" class="sidebar__link">
            <span class="nav-icon">⭐</span>
            Reviews
          </a>

          <a routerLink="/categories" routerLinkActive="active" class="sidebar__link">
            <span class="nav-icon">🗂️</span>
            Categories
          </a>
        </nav>

        <div class="sidebar__footer">
          @if (user()) {
            <div class="sidebar__user">
              <strong>{{ user()!.firstName }} {{ user()!.lastName }}</strong>
              {{ user()!.email }}
            </div>
          }
          <button class="btn btn-ghost btn-sm" style="width: 100%" (click)="logout()">
            Sign out
          </button>
        </div>
      </aside>

      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class LayoutComponent {
  private authService = inject(AdminAuthService);

  user = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}

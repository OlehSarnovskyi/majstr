import { Component, inject, signal } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../core/services/admin-auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  template: `
    <!-- Mobile top bar -->
    <header class="mobile-topbar">
      <button class="hamburger" (click)="toggleSidebar()" [class.is-open]="sidebarOpen()" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <span class="mobile-topbar__title">🔧 Majstr Admin</span>
    </header>

    <!-- Backdrop -->
    @if (sidebarOpen()) {
      <div class="sidebar-backdrop" (click)="closeSidebar()"></div>
    }

    <div class="admin-layout">
      <aside class="sidebar" [class.is-open]="sidebarOpen()">
        <div class="sidebar__brand">
          <h2>🔧 Majstr Admin</h2>
          <span>admin.majstr.app</span>
          <button class="sidebar__close" (click)="closeSidebar()" aria-label="Close menu">✕</button>
        </div>

        <nav class="sidebar__nav">
          <div class="sidebar__nav-label">Main</div>

          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="sidebar__link"
            (click)="closeSidebar()"
          >
            <span class="nav-icon">📊</span>
            Dashboard
          </a>

          <a routerLink="/users" routerLinkActive="active" class="sidebar__link" (click)="closeSidebar()">
            <span class="nav-icon">👥</span>
            Users
          </a>

          <a routerLink="/bookings" routerLinkActive="active" class="sidebar__link" (click)="closeSidebar()">
            <span class="nav-icon">📅</span>
            Bookings
          </a>

          <a routerLink="/reviews" routerLinkActive="active" class="sidebar__link" (click)="closeSidebar()">
            <span class="nav-icon">⭐</span>
            Reviews
          </a>

          <a routerLink="/categories" routerLinkActive="active" class="sidebar__link" (click)="closeSidebar()">
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
  sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}

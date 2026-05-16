import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminApiService, AdminUser } from '../../core/services/admin-api.service';
import { DatePipe } from '@angular/common';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-header">
      <h1>Users</h1>
      <p>Manage platform users</p>
    </div>

    <div class="data-table-wrapper">
      <div class="filters-bar">
        <input
          type="search"
          class="form-control"
          style="max-width: 260px"
          placeholder="Search by name or email..."
          [(ngModel)]="searchInput"
          (ngModelChange)="onSearchChange($event)"
        />

        <select class="form-control" style="max-width: 160px" [(ngModel)]="roleFilter" (ngModelChange)="onFilterChange()">
          <option value="">All roles</option>
          <option value="CLIENT">Client</option>
          <option value="MASTER">Master</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-state">Loading users...</div>
      } @else if (users().length === 0) {
        <div class="empty-state">
          <span>👥</span>
          <span>No users found</span>
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Banned</th>
              <th>Services</th>
              <th>Bookings</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr [class.row--banned]="user.isBanned">
                <td>{{ user.email }}</td>
                <td>{{ user.firstName }} {{ user.lastName }}</td>
                <td>
                  <span class="badge" [class]="roleBadgeClass(user.role)">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  @if (user.isBanned) {
                    <span class="badge badge--danger">Banned</span>
                  } @else {
                    <span class="badge badge--success">Active</span>
                  }
                </td>
                <td>{{ user._count.services }}</td>
                <td>{{ user._count.bookingsAsClient }}</td>
                <td class="text-muted text-sm">{{ user.createdAt | date: 'dd MMM yyyy' }}</td>
                <td>
                  @if (user.isBanned) {
                    <button
                      class="btn btn-secondary btn-sm"
                      (click)="unbanUser(user)"
                      [disabled]="actionLoading() === user.id"
                    >
                      Unban
                    </button>
                  } @else {
                    <button
                      class="btn btn-danger btn-sm"
                      (click)="banUser(user)"
                      [disabled]="actionLoading() === user.id"
                    >
                      Ban
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        <div class="pagination">
          <span class="pagination__info">
            Showing {{ (page() - 1) * pageSize + 1 }}–{{ minVal(page() * pageSize, total()) }} of {{ total() }} users
          </span>
          <div class="pagination__controls">
            <button
              class="btn btn-ghost btn-sm"
              [disabled]="page() <= 1"
              (click)="prevPage()"
            >
              ← Prev
            </button>
            <span style="font-size: 0.85rem; color: var(--color-text-light)">
              Page {{ page() }} of {{ totalPages() }}
            </span>
            <button
              class="btn btn-ghost btn-sm"
              [disabled]="page() >= totalPages()"
              (click)="nextPage()"
            >
              Next →
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class UsersComponent implements OnInit, OnDestroy {
  private apiService = inject(AdminApiService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  actionLoading = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  pageSize = PAGE_SIZE;

  searchInput = '';
  roleFilter = '';

  get totalPages(): () => number {
    return () => Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page.set(1);
        this.loadUsers();
      });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.apiService
      .getUsers({
        page: this.page(),
        limit: this.pageSize,
        role: this.roleFilter || undefined,
        search: this.searchInput || undefined,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  onSearchChange(value: string): void {
    this.search$.next(value);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadUsers();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadUsers();
    }
  }

  banUser(user: AdminUser): void {
    if (!confirm(`Ban ${user.firstName} ${user.lastName}? They will not be able to use the platform.`)) return;

    this.actionLoading.set(user.id);
    this.apiService.banUser(user.id).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, isBanned: true } : u)),
        );
        this.actionLoading.set(null);
      },
      error: () => {
        this.actionLoading.set(null);
      },
    });
  }

  unbanUser(user: AdminUser): void {
    if (!confirm(`Unban ${user.firstName} ${user.lastName}?`)) return;

    this.actionLoading.set(user.id);
    this.apiService.unbanUser(user.id).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, isBanned: false } : u)),
        );
        this.actionLoading.set(null);
      },
      error: () => {
        this.actionLoading.set(null);
      },
    });
  }

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'badge badge--danger';
      case 'MASTER': return 'badge badge--info';
      default: return 'badge badge--neutral';
    }
  }

  minVal(a: number, b: number): number {
    return Math.min(a, b);
  }
}

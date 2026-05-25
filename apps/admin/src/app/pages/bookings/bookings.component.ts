import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe, LowerCasePipe } from '@angular/common';
import { AdminApiService, AdminBooking } from '../../core/services/admin-api.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe, LowerCasePipe],
  template: `
    <div class="page-header">
      <h1>Bookings</h1>
      <p>All platform bookings</p>
    </div>

    <div class="data-table-wrapper">
      <div class="filters-bar">
        <select
          class="form-control"
          style="max-width: 160px"
          [(ngModel)]="statusFilter"
          (ngModelChange)="onFilterChange()"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          type="date"
          class="form-control"
          style="max-width: 160px"
          [(ngModel)]="dateFrom"
          (ngModelChange)="onFilterChange()"
          placeholder="From date"
        />

        <input
          type="date"
          class="form-control"
          style="max-width: 160px"
          [(ngModel)]="dateTo"
          (ngModelChange)="onFilterChange()"
          placeholder="To date"
        />
      </div>

      @if (loading()) {
        <div class="loading-state">Loading bookings...</div>
      } @else if (bookings().length === 0) {
        <div class="empty-state">
          <span>📅</span>
          <span>No bookings found</span>
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Master</th>
              <th>Service</th>
              <th>Status</th>
              <th>Date</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            @for (booking of bookings(); track booking.id) {
              <tr>
                <td>
                  @if (booking.client) {
                    <div style="font-weight: 500;">{{ booking.client.firstName }} {{ booking.client.lastName }}</div>
                    <div class="text-muted text-sm">{{ booking.client.email }}</div>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
                <td>
                  @if (booking.master) {
                    <div style="font-weight: 500;">{{ booking.master.firstName }} {{ booking.master.lastName }}</div>
                    <div class="text-muted text-sm">{{ booking.master.email }}</div>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
                <td>{{ booking.service?.name ?? '—' }}</td>
                <td>
                  <span class="badge" [class]="statusBadge(booking.status)">
                    {{ booking.status | lowercase }}
                  </span>
                </td>
                <td class="text-sm">
                  {{ booking.startTime | date: 'dd MMM yyyy, HH:mm' }}
                </td>
                <td>
                  @if (booking.actualPrice !== null) {
                    {{ booking.actualPrice | currency: 'EUR' }}
                  } @else if (booking.estimatedPrice !== null) {
                    ~{{ booking.estimatedPrice | currency: 'EUR' }}
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        <div class="pagination">
          <span class="pagination__info">
            Showing {{ (page() - 1) * pageSize + 1 }}–{{ minVal(page() * pageSize, total()) }} of {{ total() }} bookings
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
export class BookingsComponent implements OnInit {
  private apiService = inject(AdminApiService);

  bookings = signal<AdminBooking[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = PAGE_SIZE;

  statusFilter = '';
  dateFrom = '';
  dateTo = '';

  get totalPages(): () => number {
    return () => Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.apiService
      .getBookings({
        page: this.page(),
        limit: this.pageSize,
        status: this.statusFilter || undefined,
        dateFrom: this.dateFrom || undefined,
        dateTo: this.dateTo || undefined,
      })
      .subscribe({
        next: (res) => {
          this.bookings.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadBookings();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadBookings();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadBookings();
    }
  }

  statusBadge(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'badge badge--pending';
      case 'CONFIRMED': return 'badge badge--confirmed';
      case 'COMPLETED': return 'badge badge--completed';
      case 'CANCELLED': return 'badge badge--cancelled';
      default: return 'badge badge--neutral';
    }
  }

  minVal(a: number, b: number): number {
    return Math.min(a, b);
  }
}

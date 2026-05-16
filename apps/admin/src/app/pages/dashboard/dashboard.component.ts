import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminApiService, Stats } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Overview of your platform</p>
    </div>

    @if (loading()) {
      <div class="loading-state">Loading stats...</div>
    } @else if (stats()) {
      <!-- Primary stats -->
      <div class="stat-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-card__icon">🔨</div>
          <div class="stat-card__label">Masters</div>
          <div class="stat-card__value">{{ stats()!.masters }}</div>
        </div>

        <div class="stat-card stat-card--accent">
          <div class="stat-card__icon">👤</div>
          <div class="stat-card__label">Clients</div>
          <div class="stat-card__value">{{ stats()!.clients }}</div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-card__icon">📅</div>
          <div class="stat-card__label">Total Bookings</div>
          <div class="stat-card__value">{{ stats()!.bookings.total }}</div>
        </div>

        <div class="stat-card stat-card--primary">
          <div class="stat-card__icon">⭐</div>
          <div class="stat-card__label">Reviews</div>
          <div class="stat-card__value">{{ stats()!.reviews }}</div>
        </div>

        <div class="stat-card stat-card--accent">
          <div class="stat-card__icon">📈</div>
          <div class="stat-card__label">Avg Rating</div>
          <div class="stat-card__value">
            {{ stats()!.avgRating !== null ? (stats()!.avgRating! | number: '1.1-1') : '—' }}
          </div>
        </div>
      </div>

      <!-- Booking breakdown -->
      <h3 style="margin-bottom: 16px; font-size: 1rem; font-weight: 600; color: var(--color-text-light); text-transform: uppercase; letter-spacing: 0.05em;">
        Booking Status Breakdown
      </h3>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-card__icon">⏳</div>
          <div class="stat-card__label">Pending</div>
          <div class="stat-card__value" style="color: #92400E;">{{ stats()!.bookings.pending }}</div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-card__icon">✅</div>
          <div class="stat-card__label">Confirmed</div>
          <div class="stat-card__value" style="color: #065F46;">{{ stats()!.bookings.confirmed }}</div>
        </div>

        <div class="stat-card stat-card--primary">
          <div class="stat-card__icon">🏁</div>
          <div class="stat-card__label">Completed</div>
          <div class="stat-card__value" style="color: #1E40AF;">{{ stats()!.bookings.completed }}</div>
        </div>

        <div class="stat-card stat-card--danger">
          <div class="stat-card__icon">❌</div>
          <div class="stat-card__label">Cancelled</div>
          <div class="stat-card__value" style="color: #991B1B;">{{ stats()!.bookings.cancelled }}</div>
        </div>
      </div>
    } @else if (error()) {
      <div class="error-message">{{ error() }}</div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private apiService = inject(AdminApiService);

  stats = signal<Stats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.apiService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load stats.');
        this.loading.set(false);
      },
    });
  }
}

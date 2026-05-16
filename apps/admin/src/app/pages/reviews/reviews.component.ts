import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminApiService, AdminReview } from '../../core/services/admin-api.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-header">
      <h1>Reviews</h1>
      <p>Manage platform reviews</p>
    </div>

    <div class="data-table-wrapper">
      <div class="filters-bar">
        <label style="font-size: 0.875rem; color: var(--color-text-light);">Min rating:</label>
        <select
          class="form-control"
          style="max-width: 100px"
          [(ngModel)]="minRating"
          (ngModelChange)="onFilterChange()"
        >
          <option value="">Any</option>
          <option value="1">1 ★</option>
          <option value="2">2 ★</option>
          <option value="3">3 ★</option>
          <option value="4">4 ★</option>
          <option value="5">5 ★</option>
        </select>

        <label style="font-size: 0.875rem; color: var(--color-text-light);">Max rating:</label>
        <select
          class="form-control"
          style="max-width: 100px"
          [(ngModel)]="maxRating"
          (ngModelChange)="onFilterChange()"
        >
          <option value="">Any</option>
          <option value="1">1 ★</option>
          <option value="2">2 ★</option>
          <option value="3">3 ★</option>
          <option value="4">4 ★</option>
          <option value="5">5 ★</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-state">Loading reviews...</div>
      } @else if (reviews().length === 0) {
        <div class="empty-state">
          <span>⭐</span>
          <span>No reviews found</span>
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Client → Master</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (review of reviews(); track review.id) {
              <tr>
                <td>
                  <div style="font-weight: 500;">
                    {{ review.booking.client.firstName }} {{ review.booking.client.lastName }}
                  </div>
                  <div class="text-muted text-sm">→ {{ review.booking.master.firstName }} {{ review.booking.master.lastName }}</div>
                </td>
                <td>
                  <span style="color: #F59E0B; font-size: 1rem; letter-spacing: 1px;">
                    {{ starsStr(review.rating) }}
                  </span>
                  <span class="text-muted text-sm" style="margin-left: 4px;">{{ review.rating }}/5</span>
                </td>
                <td style="max-width: 300px;">
                  @if (review.comment) {
                    <span class="text-sm" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      {{ review.comment }}
                    </span>
                  } @else {
                    <span class="text-muted text-sm">No comment</span>
                  }
                </td>
                <td class="text-muted text-sm">
                  {{ review.createdAt | date: 'dd MMM yyyy' }}
                </td>
                <td>
                  <button
                    class="btn btn-danger btn-sm"
                    (click)="deleteReview(review)"
                    [disabled]="actionLoading() === review.id"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <div class="pagination">
          <span class="pagination__info">
            Showing {{ (page() - 1) * pageSize + 1 }}–{{ minVal(page() * pageSize, total()) }} of {{ total() }} reviews
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
export class ReviewsComponent implements OnInit {
  private apiService = inject(AdminApiService);

  reviews = signal<AdminReview[]>([]);
  loading = signal(true);
  actionLoading = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  pageSize = PAGE_SIZE;

  minRating = '';
  maxRating = '';

  get totalPages(): () => number {
    return () => Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading.set(true);
    this.apiService
      .getReviews({
        page: this.page(),
        limit: this.pageSize,
        minRating: this.minRating ? Number(this.minRating) : undefined,
        maxRating: this.maxRating ? Number(this.maxRating) : undefined,
      })
      .subscribe({
        next: (res) => {
          this.reviews.set(res.data);
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
    this.loadReviews();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadReviews();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadReviews();
    }
  }

  deleteReview(review: AdminReview): void {
    if (!confirm('Delete this review? This action cannot be undone.')) return;

    this.actionLoading.set(review.id);
    this.apiService.deleteReview(review.id).subscribe({
      next: () => {
        this.reviews.update((list) => list.filter((r) => r.id !== review.id));
        this.total.update((t) => t - 1);
        this.actionLoading.set(null);
      },
      error: () => {
        this.actionLoading.set(null);
      },
    });
  }

  starsStr(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  minVal(a: number, b: number): number {
    return Math.min(a, b);
  }
}

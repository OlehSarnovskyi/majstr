import { Component, inject, signal, OnInit } from '@angular/core';
import { AdminApiService, AdminCategory } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [],
  template: `
    <div class="page-header">
      <h1>Categories</h1>
      <p>Service categories on the platform</p>
    </div>

    <div class="data-table-wrapper">
      @if (loading()) {
        <div class="loading-state">Loading categories...</div>
      } @else if (categories().length === 0) {
        <div class="empty-state">
          <span>🗂️</span>
          <span>No categories found</span>
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Services</th>
              <th>Masters</th>
            </tr>
          </thead>
          <tbody>
            @for (cat of categories(); track cat.id) {
              <tr>
                <td style="width: 56px; text-align: center;">
                  @if (cat.icon) {
                    <span class="material-icons" style="font-size: 1.5rem; color: #475569;">{{ cat.icon }}</span>
                  } @else {
                    <span>—</span>
                  }
                </td>
                <td style="font-weight: 500;">{{ cat.name }}</td>
                <td>
                  <code style="background: #F1F5F9; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
                    {{ cat.slug }}
                  </code>
                </td>
                <td>{{ cat._count.services }}</td>
                <td>{{ cat._count.masterCategories }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class CategoriesComponent implements OnInit {
  private apiService = inject(AdminApiService);

  categories = signal<AdminCategory[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.apiService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}

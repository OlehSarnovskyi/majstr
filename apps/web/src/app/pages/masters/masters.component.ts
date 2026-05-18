import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Category, City, PublicMaster } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
})
export class MastersComponent implements OnInit {
  masters  = signal<PublicMaster[]>([]);
  loading  = signal(true);
  cities   = signal<City[]>([]);
  categories = signal<Category[]>([]);

  selectedCity     = '';   // city slug
  selectedCategory = '';   // category slug

  auth = inject(AuthService);
  private api = inject(ApiService);
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.setPage('Majstri', 'Prehliadajte overených remeselníkov a profesionálov na Majster.sk');
    this.api.getCities().subscribe((c) => this.cities.set(c));
    this.api.getCategories().subscribe((c) => this.categories.set(c));
    this.loadMasters();
  }

  loadMasters() {
    this.loading.set(true);
    const filters: { city?: string; category?: string } = {};
    if (this.selectedCity)     filters.city     = this.selectedCity;
    if (this.selectedCategory) filters.category = this.selectedCategory;
    this.api.getMasters(Object.keys(filters).length ? filters : undefined).subscribe({
      next:  (m) => { this.masters.set(m); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  onFilterChange() {
    this.loadMasters();
  }

  resetFilters() {
    this.selectedCity = '';
    this.selectedCategory = '';
    this.loadMasters();
  }

  hasActiveFilters(): boolean {
    return !!this.selectedCity || !!this.selectedCategory;
  }

  getInitials(m: PublicMaster): string {
    return (m.firstName[0] + m.lastName[0]).toUpperCase();
  }
}

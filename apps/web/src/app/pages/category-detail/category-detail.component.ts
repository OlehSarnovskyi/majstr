import { Component, OnInit, signal, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Category, Service } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './category-detail.component.html',
  styleUrl: './category-detail.component.scss',
})
export class CategoryDetailComponent implements OnInit {
  slug = input.required<string>();
  category = signal<(Category & { services: Service[] }) | null>(null);
  loading = signal(true);

  auth = inject(AuthService);
  private api = inject(ApiService);
  private seo = inject(SeoService);

  ngOnInit() {
    this.api.getCategoryBySlug(this.slug()).subscribe({
      next: (cat) => {
        this.category.set(cat);
        this.loading.set(false);
        this.seo.setPage(cat.name, `Nájdite služby a profesionálov v kategórii ${cat.name} na Majster.sk`);
      },
      error: () => this.loading.set(false),
    });
  }
}

import { Component, OnInit, signal, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService, MasterProfile, ReviewWithClient } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';

const BIO_LIMIT = 220;

@Component({
  selector: 'app-master-profile',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, StarRatingComponent],
  templateUrl: './master-profile.component.html',
  styleUrl: './master-profile.component.scss',
})
export class MasterProfileComponent implements OnInit {
  /** Accepts either a slug ("jan-novak") or a legacy UUID. */
  id = input.required<string>();
  profile = signal<MasterProfile | null>(null);
  loading = signal(true);
  bioExpanded = signal(false);
  reviews = signal<ReviewWithClient[]>([]);
  loadingReviews = signal(false);

  readonly bioLimit = BIO_LIMIT;

  auth = inject(AuthService);
  private api = inject(ApiService);
  private seo = inject(SeoService);

  ngOnInit() {
    this.api.getMaster(this.id()).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
        const fullName = `${p.user.firstName} ${p.user.lastName}`;
        this.seo.setPage(
          fullName,
          `${fullName} — profesionálny majster na Majstr. ${p.user.services?.length || 0} dostupných služieb.`,
          `/masters/${p.slug}`
        );
        this.seo.setJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: fullName,
          url: `https://majstr.app/masters/${p.slug}`,
          ...(p.user.bio ? { description: p.user.bio } : {}),
          ...(p.user.city ? {
            address: {
              '@type': 'PostalAddress',
              addressLocality: p.user.city.name,
              addressCountry: 'SK',
            },
          } : {}),
          ...(p.user.services?.length ? {
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Služby',
              itemListElement: p.user.services.map(s => ({
                '@type': 'Offer',
                name: s.name,
                description: s.description,
                price: s.price,
                priceCurrency: 'EUR',
              })),
            },
          } : {}),
        });
        // Load reviews separately after profile resolves (slug is confirmed)
        this.loadReviews(p.slug);
      },
      error: () => this.loading.set(false),
    });
  }

  loadReviews(slug: string) {
    this.loadingReviews.set(true);
    this.api.getMasterReviews(slug).subscribe({
      next: (r) => {
        this.reviews.set(r);
        this.loadingReviews.set(false);
      },
      error: () => this.loadingReviews.set(false),
    });
  }

  getInitials(p: MasterProfile): string {
    return (p.user.firstName[0] + p.user.lastName[0]).toUpperCase();
  }

  getWorkingDays(p: MasterProfile): string {
    if (!p.user.workingHours) return '';
    const labels: Record<string, string> = {
      mon: 'Po', tue: 'Ut', wed: 'St', thu: 'Št', fri: 'Pi', sat: 'So', sun: 'Ne',
    };
    return Object.entries(p.user.workingHours)
      .filter(([, v]) => v.enabled)
      .map(([k]) => labels[k])
      .join(', ');
  }

  getMemberSince(p: MasterProfile): string {
    if (!p.createdAt) return '';
    return new Date(p.createdAt).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
  }

  bioText(p: MasterProfile): string {
    const bio = p.user.bio;
    if (!bio) return '';
    if (this.bioExpanded() || bio.length <= this.bioLimit) return bio;
    return bio.slice(0, this.bioLimit).trimEnd() + '…';
  }

  toggleBio() {
    this.bioExpanded.set(!this.bioExpanded());
  }
}

import { Component, OnInit, signal, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, MasterProfile } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';

const BIO_LIMIT = 220;

@Component({
  selector: 'app-master-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './master-profile.component.html',
  styleUrl: './master-profile.component.scss',
})
export class MasterProfileComponent implements OnInit {
  /** Accepts either a slug ("jan-novak") or a legacy UUID. */
  id = input.required<string>();
  profile = signal<MasterProfile | null>(null);
  loading = signal(true);
  bioExpanded = signal(false);

  readonly bioLimit = BIO_LIMIT;

  auth = inject(AuthService);
  private api = inject(ApiService);
  private seo = inject(SeoService);

  ngOnInit() {
    this.api.getMaster(this.id()).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
        this.seo.setPage(
          `${p.user.firstName} ${p.user.lastName}`,
          `${p.user.firstName} ${p.user.lastName} — profesionálny majster na Majster.sk. ${p.user.services?.length || 0} dostupných služieb.`
        );
      },
      error: () => this.loading.set(false),
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

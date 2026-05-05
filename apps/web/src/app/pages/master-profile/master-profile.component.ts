import { Component, OnInit, signal, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Master } from '../../core/services/api.service';
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
  id = input.required<string>();
  master = signal<Master | null>(null);
  loading = signal(true);
  bioExpanded = signal(false);

  readonly bioLimit = BIO_LIMIT;

  private api = inject(ApiService);
  private seo = inject(SeoService);

  ngOnInit() {
    this.api.getMaster(this.id()).subscribe({
      next: (m) => {
        this.master.set(m);
        this.loading.set(false);
        this.seo.setPage(
          `${m.firstName} ${m.lastName}`,
          `${m.firstName} ${m.lastName} — profesionálny majster na Majster.sk. ${m.services?.length || 0} dostupných služieb.`
        );
      },
      error: () => this.loading.set(false),
    });
  }

  getInitials(m: Master): string {
    return (m.firstName[0] + m.lastName[0]).toUpperCase();
  }

  getWorkingDays(m: Master): string {
    if (!m.workingHours) return '';
    const labels: Record<string, string> = {
      mon: 'Po', tue: 'Ut', wed: 'St', thu: 'Št', fri: 'Pi', sat: 'So', sun: 'Ne',
    };
    const enabled = Object.entries(m.workingHours)
      .filter(([, v]) => v.enabled)
      .map(([k]) => labels[k]);
    return enabled.length ? enabled.join(', ') : '';
  }

  getMemberSince(m: Master): string {
    if (!m.createdAt) return '';
    const d = new Date(m.createdAt);
    return d.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
  }

  bioText(m: Master): string {
    if (!m.bio) return '';
    if (this.bioExpanded() || m.bio.length <= this.bioLimit) return m.bio;
    return m.bio.slice(0, this.bioLimit).trimEnd() + '…';
  }

  toggleBio() {
    this.bioExpanded.set(!this.bioExpanded());
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, PublicMaster } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
})
export class MastersComponent implements OnInit {
  masters = signal<PublicMaster[]>([]);
  loading = signal(true);

  auth = inject(AuthService);
  private api = inject(ApiService);
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.setPage('Majstri', 'Prehliadajte overených remeselníkov a profesionálov na Majster.sk');
    this.api.getMasters().subscribe({
      next: (m) => {
        this.masters.set(m);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getInitials(m: PublicMaster): string {
    return (m.firstName[0] + m.lastName[0]).toUpperCase();
  }
}

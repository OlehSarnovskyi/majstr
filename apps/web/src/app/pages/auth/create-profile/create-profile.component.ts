import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

/** Converts a display name to a slug candidate (client-side preview only). */
function toSlugPreview(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

@Component({
  selector: 'app-create-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-profile.component.html',
  styleUrl: './create-profile.component.scss',
})
export class CreateProfileComponent implements OnInit {
  slug = signal('');
  description = signal('');

  /** null = checking, true = available, false = taken */
  slugAvailable = signal<boolean | null>(null);
  slugChecking = signal(false);

  submitting = signal(false);
  error = signal('');

  private slugInput$ = new Subject<string>();

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  /** Live preview URL shown below the input */
  readonly previewUrl = computed(
    () => `majster.sk/masters/${this.slug() || '...'}`
  );

  readonly slugError = computed(() => {
    const s = this.slug();
    if (!s) return '';
    if (s.length < 2) return 'Minimálne 2 znaky';
    if (s.length > 60) return 'Maximálne 60 znakov';
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(s))
      return 'Iba malé písmená, číslice a pomlčky (bez pomlčky na začiatku/konci)';
    return '';
  });

  readonly canSubmit = computed(
    () =>
      !this.slugError() &&
      this.slug().length >= 2 &&
      this.slugAvailable() === true &&
      !this.submitting()
  );

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      // Pre-fill slug from user's name
      const candidate = toSlugPreview(`${user.firstName} ${user.lastName}`);
      this.slug.set(candidate);
    }

    // Debounced slug availability check
    this.slugInput$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((slug) => {
          this.slugChecking.set(true);
          this.slugAvailable.set(null);
          const userId = this.auth.user()?.id;
          return this.api.checkSlugAvailability(slug, userId);
        })
      )
      .subscribe({
        next: (res) => {
          this.slugAvailable.set(res.available);
          this.slugChecking.set(false);
        },
        error: () => {
          this.slugChecking.set(false);
          this.slugAvailable.set(null);
        },
      });

    // Trigger initial check for pre-filled slug
    if (this.slug()) {
      this.onSlugChange(this.slug());
    }
  }

  onSlugChange(value: string) {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.slug.set(clean);
    this.slugAvailable.set(null);
    if (clean.length >= 2 && !this.slugError()) {
      this.slugInput$.next(clean);
    }
  }

  submit() {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.error.set('');

    this.api
      .createMasterProfile({
        slug: this.slug(),
        description: this.description().trim() || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          const msg = err?.error?.message;
          this.error.set(
            typeof msg === 'string'
              ? msg
              : 'Nepodarilo sa vytvoriť profil. Skúste znova.'
          );
          this.submitting.set(false);
        },
      });
  }
}

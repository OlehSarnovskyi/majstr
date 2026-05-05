import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { WorkingHours, DaySchedule } from '../../core/services/api.service';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayKey = (typeof DAY_KEYS)[number];

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Pondelok',
  tue: 'Utorok',
  wed: 'Streda',
  thu: 'Štvrtok',
  fri: 'Piatok',
  sat: 'Sobota',
  sun: 'Nedeľa',
};

function defaultWorkingHours(): WorkingHours {
  return {
    mon: { enabled: true,  from: '08:00', to: '18:00' },
    tue: { enabled: true,  from: '08:00', to: '18:00' },
    wed: { enabled: true,  from: '08:00', to: '18:00' },
    thu: { enabled: true,  from: '08:00', to: '18:00' },
    fri: { enabled: true,  from: '08:00', to: '18:00' },
    sat: { enabled: false, from: '09:00', to: '14:00' },
    sun: { enabled: false, from: '09:00', to: '14:00' },
  };
}

function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 6; h <= 22; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) options.push(`${String(h).padStart(2, '0')}:30`);
  }
  return options;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  saving = signal(false);
  saved = signal(false);
  uploadingAvatar = signal(false);
  avatarPreview = signal<string | null>(null);

  firstName = '';
  lastName = '';
  phone = '';
  bio = '';
  city = '';

  readonly dayKeys = DAY_KEYS;
  readonly dayLabels = DAY_LABELS;
  readonly timeOptions = buildTimeOptions();
  workingHours: WorkingHours = defaultWorkingHours();

  auth = inject(AuthService);
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  constructor() {
    const u = this.auth.user();
    if (u) {
      this.firstName = u.firstName;
      this.lastName = u.lastName;
      this.phone = u.phone || '';
      this.bio = u.bio || '';
      this.city = u.city || '';
      if (u.avatar) {
        this.avatarPreview.set(u.avatar);
      }
      if (u.workingHours) {
        this.workingHours = { ...defaultWorkingHours(), ...u.workingHours } as WorkingHours;
      }
    }
  }

  ngOnInit() {
    this.seo.setPage('Upraviť profil');
  }

  getDay(key: DayKey): DaySchedule {
    return this.workingHours[key];
  }

  toOptions(from: string): string[] {
    return this.timeOptions.filter((t) => t > from);
  }

  onFromChange(key: DayKey) {
    const day = this.workingHours[key];
    if (day.to <= day.from) {
      const next = this.toOptions(day.from)[0];
      if (next) day.to = next;
    }
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      this.toast.error('Povolené sú iba JPEG, PNG a WebP obrázky');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('Maximálna veľkosť súboru je 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);

    this.uploadingAvatar.set(true);
    this.auth.uploadAvatar(file).subscribe({
      next: () => {
        this.uploadingAvatar.set(false);
        this.toast.success('Fotka profilu bola aktualizovaná');
      },
      error: () => {
        this.uploadingAvatar.set(false);
        this.avatarPreview.set(this.auth.user()?.avatar || null);
      },
    });
  }

  private readonly PHONE_REGEX = /^\+?[\d\s\-()]{9,20}$/;

  get phoneError(): string {
    const trimmed = this.phone.trim();
    if (!trimmed) {
      return this.auth.isMaster() ? 'Telefón je povinný pre majstrov' : '';
    }
    if (!this.PHONE_REGEX.test(trimmed)) {
      return 'Zadajte platný formát (napr. +421 900 123 456)';
    }
    return '';
  }

  get canSave(): boolean {
    const bioOk = !this.auth.isMaster() || this.bio.length === 0 || this.bio.length >= 10;
    return (
      this.firstName.length >= 2 &&
      this.lastName.length >= 2 &&
      this.phoneError === '' &&
      bioOk
    );
  }

  save() {
    if (!this.canSave) return;
    this.saving.set(true);

    const dto: Parameters<typeof this.auth.updateProfile>[0] = {
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone || undefined,
      bio: this.bio || undefined,
      city: this.city || undefined,
    };

    if (this.auth.isMaster()) {
      dto.workingHours = this.workingHours;
    }

    this.auth.updateProfile(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.toast.success('Profil bol úspešne aktualizovaný');
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Nepodarilo sa aktualizovať profil');
        this.saving.set(false);
      },
    });
  }

  async deleteAccount() {
    const confirmed = await this.confirm.confirm({
      title: 'Vymazať účet',
      message:
        'Naozaj chcete vymazať svoj účet? Všetky vaše údaje, rezervácie a služby budú nenávratne vymazané.',
      confirmText: 'Vymazať účet',
      cancelText: 'Zrušiť',
      danger: true,
    });

    if (confirmed) {
      this.auth.deleteAccount().subscribe({
        next: () => {
          this.toast.success('Váš účet bol vymazaný');
          this.auth.logout();
        },
      });
    }
  }
}

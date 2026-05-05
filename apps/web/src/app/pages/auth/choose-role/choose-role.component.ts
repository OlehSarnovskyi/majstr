import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { WorkingHours, DaySchedule } from '../../../core/services/api.service';

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

/** Generates time options every 30 min from 06:00 to 22:00 */
function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 6; h <= 22; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) options.push(`${String(h).padStart(2, '0')}:30`);
  }
  return options;
}

@Component({
  selector: 'app-choose-role',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './choose-role.component.html',
  styleUrl: './choose-role.component.scss',
})
export class ChooseRoleComponent {
  selectedRole = signal<string | null>(null);
  phone = '';
  city = '';
  phoneError = '';
  cityError = '';
  scheduleError = '';
  loading = signal(false);

  readonly dayKeys = DAY_KEYS;
  readonly dayLabels = DAY_LABELS;
  readonly timeOptions = buildTimeOptions();
  workingHours: WorkingHours = defaultWorkingHours();

  private auth = inject(AuthService);
  private router = inject(Router);

  selectRole(role: string) {
    this.selectedRole.set(role);
    this.phoneError = '';
    this.cityError = '';
    this.scheduleError = '';
  }

  getDay(key: DayKey): DaySchedule {
    return this.workingHours[key];
  }

  /** Returns time options that are valid for the "to" field (must be after "from") */
  toOptions(from: string): string[] {
    return this.timeOptions.filter((t) => t > from);
  }

  /** When "from" changes, ensure "to" is still after "from" */
  onFromChange(key: DayKey) {
    const day = this.workingHours[key];
    if (day.to <= day.from) {
      const next = this.toOptions(day.from)[0];
      if (next) day.to = next;
    }
  }

  private validateSchedule(): boolean {
    if (this.selectedRole() !== 'MASTER') return true;
    const hasEnabled = DAY_KEYS.some((k) => this.workingHours[k].enabled);
    if (!hasEnabled) {
      this.scheduleError = 'Vyberte aspoň jeden pracovný deň';
      return false;
    }
    this.scheduleError = '';
    return true;
  }

  confirm() {
    const role = this.selectedRole();
    if (!role) return;

    if (role === 'MASTER') {
      if (!this.phone.trim()) {
        this.phoneError = 'Telefónne číslo je povinné pre majstrov';
        return;
      }
      if (!/^\+?[\d\s\-()]{9,20}$/.test(this.phone.trim())) {
        this.phoneError = 'Zadajte platné telefónne číslo (napr. +421 900 123 456)';
        return;
      }
      if (!this.city.trim()) {
        this.cityError = 'Mesto je povinné pre majstrov';
        return;
      }
    }

    if (!this.validateSchedule()) return;

    this.phoneError = '';
    this.cityError = '';
    this.loading.set(true);
    this.auth
      .updateRole(
        role,
        role === 'MASTER' ? this.phone.trim() : undefined,
        role === 'MASTER' ? this.city.trim() : undefined,
        role === 'MASTER' ? this.workingHours : undefined
      )
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.loading.set(false),
      });
  }
}

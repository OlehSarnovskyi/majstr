import { Component, OnInit, signal, input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Service, WorkingHours } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';

const DAY_INDEX: Record<number, keyof WorkingHours> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

/**
 * Convert a working-hours slot (e.g. "10:00") on a given date in the
 * master's timezone into a UTC ISO string ready to send to the API.
 *
 * Strategy: treat the slot as if it were UTC, check what the clock in the
 * target timezone shows at that moment, compute the offset, and adjust.
 *
 * Example: date="2026-05-14", slot="10:00", tz="Europe/Bratislava" (UTC+2)
 *   → naiveUtc = 10:00 UTC → shows "12:00" in Bratislava
 *   → diff = +120 min → actual UTC = 10:00 − 120 min = 08:00 UTC ✓
 */
function slotToUtcIso(date: string, slot: string, timezone: string): string {
  const naiveUtc = new Date(`${date}T${slot}:00Z`);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(naiveUtc);

  const tzH = Number(parts.find((p) => p.type === 'hour')?.value   ?? 0);
  const tzM = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const [wantH, wantM] = slot.split(':').map(Number);

  // Positive = timezone is ahead of UTC (e.g. +120 for UTC+2)
  let diffMins = (tzH * 60 + tzM) - (wantH * 60 + wantM);
  if (diffMins >  720) diffMins -= 1440; // handle date-line wrap
  if (diffMins < -720) diffMins += 1440;

  return new Date(naiveUtc.getTime() - diffMins * 60_000).toISOString();
}

/** Generates 30-min slots between two "HH:MM" times (exclusive of `to`). */
function generateSlots(from: string, to: string): string[] {
  const slots: string[] = [];
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  let minutes = fh * 60 + fm;
  const end = th * 60 + tm;
  while (minutes < end) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    minutes += 30;
  }
  return slots;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent implements OnInit {
  id = input.required<string>();
  service = signal<Service | null>(null);
  loading = signal(true);
  submitting = signal(false);
  error = signal('');

  date = '';
  selectedSlot = '';
  address = '';
  note = '';

  private api = inject(ApiService);
  auth = inject(AuthService);
  private router = inject(Router);
  private seo = inject(SeoService);

  ngOnInit() {
    this.api.getService(this.id()).subscribe({
      next: (svc) => {
        this.service.set(svc);
        this.loading.set(false);
        this.seo.setPage(`Rezervovať ${svc.name}`);
      },
      error: () => this.loading.set(false),
    });

    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.date = tomorrow.toISOString().split('T')[0];
  }

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  /** Slots available for the selected date based on master's working hours */
  get availableSlots(): string[] {
    const svc = this.service();
    if (!this.date || !svc?.master?.workingHours) {
      // Fallback: 08:00–20:00 every 30 min
      return generateSlots('08:00', '20:00');
    }

    const wh = svc.master.workingHours;
    const jsDay = new Date(this.date + 'T12:00:00').getDay(); // noon avoids DST issues
    const dayKey = DAY_INDEX[jsDay];
    const day = wh[dayKey];

    if (!day?.enabled) return [];
    return generateSlots(day.from, day.to);
  }

  /** True when master has workingHours but the chosen day is off */
  get isDayOff(): boolean {
    const svc = this.service();
    if (!svc?.master?.workingHours || !this.date) return false;
    return this.availableSlots.length === 0;
  }

  onDateChange() {
    // Reset slot when date changes
    this.selectedSlot = '';
  }

  get addressError(): string {
    const v = this.address.trim();
    if (!v) return 'Adresa je povinná';
    if (v.length < 5) return 'Adresa musí mať aspoň 5 znakov';
    return '';
  }

  submit() {
    if (!this.date || !this.selectedSlot) {
      this.error.set('Vyberte dátum a čas');
      return;
    }
    if (this.addressError) {
      this.error.set(this.addressError);
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    // Slots are always in the master's timezone — convert to UTC explicitly.
    const masterTz = this.service()?.master?.timezone ?? 'Europe/Bratislava';
    const startTime = slotToUtcIso(this.date, this.selectedSlot, masterTz);

    this.api
      .createBooking({
        serviceId: this.id(),
        startTime,
        address: this.address.trim(),
        note: this.note || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          const raw = err.error?.message;
          const translations: Record<string, string> = {
            'Booking time must be in the future': 'Čas rezervácie musí byť v budúcnosti',
            'Service not found': 'Služba nebola nájdená',
            'Master not found': 'Majster nebol nájdený',
            'Time slot is outside master working hours': 'Vybraný čas je mimo pracovného rozvrhu majstra',
          };
          this.error.set(translations[raw] ?? raw ?? 'Nepodarilo sa vytvoriť rezerváciu');
          this.submitting.set(false);
        },
      });
  }
}

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ApiService,
  Booking,
  Category,
  Service,
} from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { FormsModule } from '@angular/forms';

const STATUS_SK: Record<string, string> = {
  PENDING: 'Čakajúca',
  CONFIRMED: 'Potvrdená',
  CANCELLED: 'Zrušená',
  COMPLETED: 'Dokončená',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  activeTab = signal<'bookings' | 'services'>('bookings');

  // Master: manage services
  myServices = signal<Service[]>([]);
  loadingServices = signal(false);
  categories = signal<Category[]>([]);
  showServiceForm = signal(false);
  editingService = signal<string | null>(null);
  savingService = signal(false);
  svcName = '';
  svcDesc = '';
  svcPrice = 0;
  svcCategoryId = '';

  pendingBookings = computed(() =>
    this.bookings().filter((b) => b.status === 'PENDING')
  );
  otherBookings = computed(() =>
    this.bookings().filter((b) => b.status !== 'PENDING')
  );

  // Complete-booking modal
  showCompleteModal = signal(false);
  completingBookingId = signal<string | null>(null);
  actualPriceInput = signal<number | null>(null);
  completing = signal(false);

  private api = inject(ApiService);
  auth = inject(AuthService);
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  ngOnInit() {
    this.seo.setPage('Nástenka');
    this.loadBookings();
    if (this.auth.isMaster()) {
      this.api.getCategories().subscribe((cats) => this.categories.set(cats));
      this.loadServices();
    }
  }

  loadBookings() {
    this.loading.set(true);
    this.api.getMyBookings().subscribe({
      next: (b) => {
        this.bookings.set(b);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadServices() {
    this.loadingServices.set(true);
    const masterId = this.auth.user()?.id;
    if (!masterId) {
      this.loadingServices.set(false);
      return;
    }
    this.api.getServices({ masterId }).subscribe({
      next: (s) => {
        this.myServices.set(s);
        this.loadingServices.set(false);
      },
      error: () => this.loadingServices.set(false),
    });
  }

  async updateStatus(id: string, status: string) {
    if (status === 'CANCELLED') {
      const confirmed = await this.confirm.confirm({
        title: 'Zrušiť rezerváciu',
        message: 'Naozaj chcete zrušiť túto rezerváciu?',
        confirmText: 'Zrušiť rezerváciu',
        cancelText: 'Ponechať',
        danger: true,
      });
      if (!confirmed) return;
    }

    this.api.updateBookingStatus(id, status).subscribe({
      next: () => {
        this.loadBookings();
        const msg =
          status === 'CONFIRMED' ? 'Rezervácia potvrdená' :
          'Rezervácia zrušená';
        this.toast.success(msg);
      },
      error: () => {
        this.loadBookings();
      },
    });
  }

  openCompleteModal(bookingId: string) {
    this.completingBookingId.set(bookingId);
    this.actualPriceInput.set(null);
    this.showCompleteModal.set(true);
  }

  closeCompleteModal() {
    this.showCompleteModal.set(false);
    this.completingBookingId.set(null);
    this.actualPriceInput.set(null);
  }

  confirmComplete() {
    const id = this.completingBookingId();
    if (!id) return;

    const price = this.actualPriceInput();
    // Send actualPrice only if positive — treat 0 or empty as "not provided"
    const actualPrice = price != null && price > 0 ? price : null;

    this.completing.set(true);
    this.api.updateBookingStatus(id, 'COMPLETED', actualPrice).subscribe({
      next: () => {
        this.completing.set(false);
        this.closeCompleteModal();
        this.loadBookings();
        this.toast.success('Rezervácia dokončená');
      },
      error: () => {
        this.completing.set(false);
        this.loadBookings();
      },
    });
  }

  isPast(startTime: string): boolean {
    return new Date(startTime) < new Date();
  }

  statusLabel(status: string): string {
    return STATUS_SK[status] || status;
  }

  statusClass(status: string): string {
    return `badge badge--${status.toLowerCase()}`;
  }

  addToGoogleCalendar(b: Booking) {
    const start = new Date(b.startTime);
    const end = new Date(start.getTime() + b.service.durationMinutes * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(b.service.name)}&dates=${fmt(start)}/${fmt(end)}${b.note ? '&details=' + encodeURIComponent(b.note) : ''}`;
    window.open(url, '_blank');
  }

  downloadIcs(b: Booking) {
    const start = new Date(b.startTime);
    const end = new Date(start.getTime() + b.service.durationMinutes * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escapeIcs = (s: string) => s.replace(/[\\;,\n]/g, (m) => m === '\n' ? '\\n' : '\\' + m);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Majster.sk//SK',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${escapeIcs(b.service.name)}`,
      b.note ? `DESCRIPTION:${escapeIcs(b.note)}` : '',
      `UID:${b.id}@majster.sk`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${b.service.name}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Service CRUD
  openNewService() {
    this.editingService.set(null);
    this.svcName = '';
    this.svcDesc = '';
    this.svcPrice = 0;
    this.svcCategoryId = this.categories()[0]?.id || '';
    this.showServiceForm.set(true);
  }

  editService(svc: Service) {
    this.editingService.set(svc.id);
    this.svcName = svc.name;
    this.svcDesc = svc.description;
    this.svcPrice = Number(svc.price);
    this.svcCategoryId = svc.categoryId;
    this.showServiceForm.set(true);
  }

  saveService() {
    // Trim whitespace before sending — prevent spaces-only values
    this.svcName = this.svcName.trim();
    this.svcDesc = this.svcDesc.trim();

    if (!this.svcName || this.svcName.length < 2) {
      this.toast.error('Názov musí mať aspoň 2 znaky');
      return;
    }
    if (!this.svcDesc || this.svcDesc.length < 10) {
      this.toast.error('Popis musí mať aspoň 10 znakov');
      return;
    }
    if (!this.svcPrice || this.svcPrice <= 0) {
      this.toast.error('Cena musí byť väčšia ako 0');
      return;
    }
    if (!this.svcCategoryId) {
      this.toast.error('Vyberte kategóriu');
      return;
    }

    this.savingService.set(true);
    const dto = {
      name: this.svcName,
      description: this.svcDesc,
      price: this.svcPrice,
      categoryId: this.svcCategoryId,
    };

    const obs = this.editingService()
      ? this.api.updateService(this.editingService() as string, dto)
      : this.api.createService(dto);

    obs.subscribe({
      next: () => {
        this.showServiceForm.set(false);
        this.savingService.set(false);
        this.loadServices();
        this.toast.success(
          this.editingService() ? 'Služba aktualizovaná' : 'Služba vytvorená'
        );
      },
      error: () => this.savingService.set(false),
    });
  }

  async deleteService(id: string) {
    const confirmed = await this.confirm.confirm({
      title: 'Vymazať službu',
      message: 'Naozaj chcete vymazať túto službu? Táto akcia sa nedá vrátiť.',
      confirmText: 'Vymazať',
      cancelText: 'Zrušiť',
      danger: true,
    });

    if (confirmed) {
      this.api.deleteService(id).subscribe({
        next: () => {
          this.loadServices();
          this.toast.success('Služba vymazaná');
        },
      });
    }
  }
}

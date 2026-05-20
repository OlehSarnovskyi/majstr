import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ApiService,
  Booking,
  Category,
  MasterProfile,
  Service,
  ServiceCategory,
} from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { FormsModule } from '@angular/forms';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';

const STATUS_SK: Record<string, string> = {
  PENDING: '⏳ Čaká na potvrdenie',
  CONFIRMED: '✓ Potvrdená',
  COMPLETED: '✓✓ Dokončená',
  CANCELLED: '✗ Zrušená',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule, StarRatingComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  activeTab = signal<'bookings' | 'services' | 'profile'>('bookings');

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

  // Master profile
  myProfile = signal<MasterProfile | null>(null);
  loadingProfile = signal(false);
  profileUrlCopied = signal(false);
  savingTimezone = signal(false);

  /** Categories the master has chosen as their specialization — used in service form. */
  masterSpecCategories = computed(() =>
    (this.myProfile()?.user.masterCategories ?? []).map((mc) => mc.category)
  );

  // Category management in profile tab
  allCategories = signal<ServiceCategory[]>([]);
  editingCategories = signal(false);
  pendingCategoryIds = signal<Set<string>>(new Set());
  savingCategories = signal(false);

  readonly timezones: { value: string; label: string }[] = [
    { value: 'Europe/Bratislava', label: 'Bratislava — CET/CEST (UTC+1/+2)' },
    { value: 'Europe/Prague',     label: 'Praha — CET/CEST (UTC+1/+2)' },
    { value: 'Europe/Warsaw',     label: 'Varšava — CET/CEST (UTC+1/+2)' },
    { value: 'Europe/Vienna',     label: 'Viedeň — CET/CEST (UTC+1/+2)' },
    { value: 'Europe/Berlin',     label: 'Berlín — CET/CEST (UTC+1/+2)' },
    { value: 'Europe/Budapest',   label: 'Budapešť — CET/CEST (UTC+1/+2)' },
    { value: 'Europe/London',     label: 'Londýn — GMT/BST (UTC+0/+1)' },
    { value: 'Europe/Paris',      label: 'Paríž — CET/CEST (UTC+1/+2)' },
    { value: 'Europe/Amsterdam',  label: 'Amsterdam — CET/CEST (UTC+1/+2)' },
    { value: 'Europe/Bucharest',  label: 'Bukurešť — EET/EEST (UTC+2/+3)' },
    { value: 'Europe/Kiev',       label: 'Kyjev — EET/EEST (UTC+2/+3)' },
    { value: 'Europe/Moscow',     label: 'Moskva — MSK (UTC+3)' },
    { value: 'America/New_York',  label: 'New York — ET (UTC-5/-4)' },
    { value: 'America/Chicago',   label: 'Chicago — CT (UTC-6/-5)' },
    { value: 'America/Denver',    label: 'Denver — MT (UTC-7/-6)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles — PT (UTC-8/-7)' },
    { value: 'Asia/Dubai',        label: 'Dubaj — GST (UTC+4)' },
    { value: 'Asia/Tokyo',        label: 'Tokio — JST (UTC+9)' },
    { value: 'UTC',               label: 'UTC (UTC+0)' },
  ];

  // Complete-booking modal
  showCompleteModal = signal(false);
  completingBookingId = signal<string | null>(null);
  actualPriceInput = signal<number | null>(null);
  completing = signal(false);

  // Welcome modal for first-time masters
  showWelcomeModal = signal(false);

  // Review form state (client only, for COMPLETED bookings)
  reviewingBookingId = signal<string | null>(null);
  reviewRating = signal<number>(0);
  reviewComment = signal<string>('');
  submittingReview = signal(false);

  private api = inject(ApiService);
  auth = inject(AuthService);
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  ngOnInit() {
    this.seo.setPage('Nástenka');
    this.loadBookings();
    if (this.auth.isMaster()) {
      this.api.getCategories().subscribe((cats) => {
        this.categories.set(cats);
        this.allCategories.set(cats);
      });
      this.loadServices();
      this.loadProfile();
    }
    this.checkWelcomeModal();
  }

  private checkWelcomeModal() {
    const user = this.auth.user();
    if (!user || user.role !== 'MASTER') return;
    const key = `welcome_shown_${user.id}`;
    if (!localStorage.getItem(key)) {
      setTimeout(() => this.showWelcomeModal.set(true), 800);
      localStorage.setItem(key, 'true');
    }
  }

  closeWelcomeModal() {
    this.showWelcomeModal.set(false);
  }

  loadProfile() {
    this.loadingProfile.set(true);
    this.api.getMyMasterProfile().subscribe({
      next: (p) => {
        this.myProfile.set(p);
        this.loadingProfile.set(false);
      },
      error: () => this.loadingProfile.set(false),
    });
  }

  saveTimezone(value: string) {
    this.savingTimezone.set(true);
    this.api.updateMasterProfile({ timezone: value }).subscribe({
      next: (p) => {
        this.myProfile.set(p);
        this.savingTimezone.set(false);
        this.toast.success('Časová zóna uložená');
      },
      error: () => {
        this.savingTimezone.set(false);
        this.toast.error('Nepodarilo sa uložiť časovú zónu');
      },
    });
  }

  copyProfileUrl() {
    const slug = this.myProfile()?.slug;
    if (!slug) return;
    const url = `${window.location.origin}/masters/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      this.profileUrlCopied.set(true);
      setTimeout(() => this.profileUrlCopied.set(false), 2000);
    });
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
    const serviceName = b.service?.name ?? 'Rezervácia';
    const durationMs = (b.service?.durationMinutes ?? 60) * 60000;
    const start = new Date(b.startTime);
    const end = new Date(start.getTime() + durationMs);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(serviceName)}&dates=${fmt(start)}/${fmt(end)}${b.note ? '&details=' + encodeURIComponent(b.note) : ''}`;
    window.open(url, '_blank');
  }

  downloadIcs(b: Booking) {
    const serviceName = b.service?.name ?? 'Rezervácia';
    const durationMs = (b.service?.durationMinutes ?? 60) * 60000;
    const start = new Date(b.startTime);
    const end = new Date(start.getTime() + durationMs);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escapeIcs = (s: string) => s.replace(/[\\;,\n]/g, (m) => m === '\n' ? '\\n' : '\\' + m);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Majstr//SK',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${escapeIcs(serviceName)}`,
      b.note ? `DESCRIPTION:${escapeIcs(b.note)}` : '',
      `UID:${b.id}@majstr.app`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${serviceName}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Service CRUD
  openNewService() {
    this.editingService.set(null);
    this.svcName = '';
    this.svcDesc = '';
    this.svcPrice = 0;
    this.svcCategoryId = this.masterSpecCategories()[0]?.id || '';
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

  // ── Category edit helpers ──────────────────────────────────────────────────

  openCategoryEdit() {
    const current = this.myProfile()?.user.masterCategories ?? [];
    this.pendingCategoryIds.set(new Set(current.map((mc) => mc.category.id)));
    this.editingCategories.set(true);
  }

  cancelCategoryEdit() {
    this.editingCategories.set(false);
  }

  isPendingCategorySelected(id: string): boolean {
    return this.pendingCategoryIds().has(id);
  }

  togglePendingCategory(id: string) {
    const current = new Set(this.pendingCategoryIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      if (current.size >= 3) return;
      current.add(id);
    }
    this.pendingCategoryIds.set(current);
  }

  saveCategories() {
    const ids = [...this.pendingCategoryIds()];
    if (ids.length < 1) {
      this.toast.error('Vyberte aspoň 1 kategóriu');
      return;
    }
    this.savingCategories.set(true);
    this.api.setMasterCategories(ids).subscribe({
      next: (p) => {
        this.myProfile.set(p);
        this.savingCategories.set(false);
        this.editingCategories.set(false);
        this.toast.success('Kategórie uložené');
      },
      error: () => {
        this.savingCategories.set(false);
        this.toast.error('Nepodarilo sa uložiť kategórie');
      },
    });
  }

  // ── Review helpers ─────────────────────────────────────────────────────────

  openReviewForm(bookingId: string) {
    this.reviewingBookingId.set(bookingId);
    this.reviewRating.set(0);
    this.reviewComment.set('');
  }

  cancelReview() {
    this.reviewingBookingId.set(null);
  }

  submitReview(bookingId: string) {
    const rating = this.reviewRating();
    if (rating < 1 || rating > 5) {
      this.toast.error('Vyberte hodnotenie (1–5 hviezdičiek)');
      return;
    }
    this.submittingReview.set(true);
    this.api.createReview({
      bookingId,
      rating,
      comment: this.reviewComment().trim() || undefined,
    }).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.reviewingBookingId.set(null);
        this.loadBookings(); // reload to get review embedded in booking
        this.toast.success('Hodnotenie odoslané, ďakujeme!');
      },
      error: () => {
        this.submittingReview.set(false);
        this.toast.error('Nepodarilo sa odoslať hodnotenie');
      },
    });
  }
}

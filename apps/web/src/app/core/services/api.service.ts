import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  _count: { services: number };
}

export interface DaySchedule {
  enabled: boolean;
  from: string; // "08:00"
  to: string;   // "18:00"
}

export interface WorkingHours {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
}

export interface Master {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio: string | null;
  city?: City | null;
  createdAt?: string;
  phone?: string | null; // returned only in booking context (PENDING/CONFIRMED), never on public profile
  workingHours?: WorkingHours | null;
  timezone?: string;
  _count?: { services: number };
  services?: Service[];
}

/** Item shape returned by GET /masters (list). */
export interface PublicMaster {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio: string | null;
  city: City | null;
  masterProfile: { slug: string } | null;
  _count: { services: number };
  averageRating?: number | null;
  reviewCount?: number;
}

/** Full profile shape returned by GET /masters/:slug and GET /masters/profile/me. */
export interface MasterProfile {
  id: string;
  slug: string;
  description: string | null;
  isVerified: boolean;
  createdAt: string;
  averageRating?: number | null;
  reviewCount?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    bio: string | null;
    city: City | null;
    workingHours: WorkingHours | null;
    timezone: string;
    services: Service[];
  };
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
  categoryId: string;
  masterId: string;
  category: { id: string; name: string; slug: string };
  master?: Master;
}

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithClient extends Review {
  booking: {
    client: { id: string; firstName: string; lastName: string; avatar: string | null };
    service: { name: string };
  };
}

export interface Booking {
  id: string;
  serviceId: string;
  clientId: string;
  masterId: string;
  startTime: string;
  endTime: string;
  status: string;
  note: string | null;
  address: string | null;
  /** Snapshot of Service.price at booking creation. Always a number or null (never a Decimal string). */
  estimatedPrice: number | null;
  /** Final price entered by master on COMPLETED. null if not provided. */
  actualPrice: number | null;
  service: Service;
  client?: { id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null };
  master?: Master;
  review?: Review | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Categories
  getCategories() {
    return this.http.get<Category[]>('/api/categories');
  }

  getCategoryBySlug(slug: string) {
    return this.http.get<Category & { services: Service[] }>(
      `/api/categories/${slug}`
    );
  }

  // Services
  getServices(filters?: { categoryId?: string; masterId?: string }) {
    const params: Record<string, string> = {};
    if (filters?.categoryId) params['categoryId'] = filters.categoryId;
    if (filters?.masterId) params['masterId'] = filters.masterId;
    return this.http.get<Service[]>('/api/services', { params });
  }

  getService(id: string) {
    return this.http.get<Service>(`/api/services/${id}`);
  }

  createService(dto: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
  }) {
    return this.http.post<Service>('/api/services', dto);
  }

  updateService(
    id: string,
    dto: Partial<{
      name: string;
      description: string;
      price: number;
      categoryId: string;
    }>
  ) {
    return this.http.patch<Service>(`/api/services/${id}`, dto);
  }

  deleteService(id: string) {
    return this.http.delete(`/api/services/${id}`);
  }

  // Cities
  getCities() {
    return this.http.get<City[]>('/api/masters/cities');
  }

  // Masters
  getMasters(filters?: { city?: string; search?: string }) {
    const params: Record<string, string> = {};
    if (filters?.city)   params['city']   = filters.city;
    if (filters?.search) params['search'] = filters.search;
    return this.http.get<PublicMaster[]>('/api/masters', { params });
  }

  /** Resolves by slug first, falls back to UUID for legacy links. */
  getMaster(slugOrId: string) {
    return this.http.get<MasterProfile>(`/api/masters/${slugOrId}`);
  }

  // Master profile management (requires auth)
  getMyMasterProfile() {
    return this.http.get<MasterProfile | null>('/api/masters/profile/me');
  }

  createMasterProfile(dto: { slug: string; description?: string }) {
    return this.http.post<MasterProfile>('/api/masters/profile', dto);
  }

  updateMasterProfile(dto: { slug?: string; description?: string; timezone?: string }) {
    return this.http.patch<MasterProfile>('/api/masters/profile', dto);
  }

  checkSlugAvailability(slug: string, userId?: string) {
    const params: Record<string, string> = { slug };
    if (userId) params['userId'] = userId;
    return this.http.get<{ slug: string; available: boolean }>(
      '/api/masters/slug/check',
      { params }
    );
  }

  // Bookings
  createBooking(dto: {
    serviceId: string;
    startTime: string;
    address: string;
    note?: string;
  }) {
    return this.http.post<Booking>('/api/bookings', dto);
  }

  getMyBookings() {
    return this.http.get<Booking[]>('/api/bookings/my');
  }

  updateBookingStatus(id: string, status: string, actualPrice?: number | null) {
    const body: Record<string, unknown> = { status };
    if (actualPrice != null) body['actualPrice'] = actualPrice;
    return this.http.patch<Booking>(`/api/bookings/${id}/status`, body);
  }

  // Reviews
  createReview(dto: { bookingId: string; rating: number; comment?: string }) {
    return this.http.post<Review>('/api/reviews', dto);
  }

  getReviewForBooking(bookingId: string) {
    return this.http.get<Review | null>(`/api/reviews/booking/${bookingId}`);
  }

  getMasterReviews(slugOrId: string) {
    return this.http.get<ReviewWithClient[]>(`/api/masters/${slugOrId}/reviews`);
  }
}

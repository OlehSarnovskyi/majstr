import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Stats {
  masters: number;
  clients: number;
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  reviews: number;
  avgRating: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  isBanned: boolean;
  _count: {
    services: number;
    bookingsAsClient: number;
  };
}

export interface AdminBooking {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  estimatedPrice: number | null;
  actualPrice: number | null;
  note: string | null;
  address: string | null;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string; email: string };
  master: { id: string; firstName: string; lastName: string; email: string };
  service: { id: string; name: string; price: number };
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  booking: {
    id: string;
    startTime: string;
    client: { firstName: string; lastName: string; email: string };
    master: { firstName: string; lastName: string; email: string };
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  _count: {
    services: number;
    masterCategories: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);

  // Stats
  getStats(): Observable<Stats> {
    return this.http.get<Stats>('/api/admin/stats');
  }

  // Users
  getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Observable<PaginatedResponse<AdminUser>> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<PaginatedResponse<AdminUser>>('/api/admin/users', { params: httpParams });
  }

  banUser(id: string): Observable<unknown> {
    return this.http.patch(`/api/admin/users/${id}/ban`, {});
  }

  unbanUser(id: string): Observable<unknown> {
    return this.http.patch(`/api/admin/users/${id}/unban`, {});
  }

  // Bookings
  getBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    masterId?: string;
    clientId?: string;
    minPrice?: number;
    maxPrice?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<PaginatedResponse<AdminBooking>> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.masterId) httpParams = httpParams.set('masterId', params.masterId);
    if (params?.clientId) httpParams = httpParams.set('clientId', params.clientId);
    if (params?.minPrice != null) httpParams = httpParams.set('minPrice', params.minPrice);
    if (params?.maxPrice != null) httpParams = httpParams.set('maxPrice', params.maxPrice);
    if (params?.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    return this.http.get<PaginatedResponse<AdminBooking>>('/api/admin/bookings', {
      params: httpParams,
    });
  }

  // Reviews
  getReviews(params?: {
    page?: number;
    limit?: number;
    minRating?: number;
    maxRating?: number;
  }): Observable<PaginatedResponse<AdminReview>> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.minRating != null) httpParams = httpParams.set('minRating', params.minRating);
    if (params?.maxRating != null) httpParams = httpParams.set('maxRating', params.maxRating);
    return this.http.get<PaginatedResponse<AdminReview>>('/api/admin/reviews', {
      params: httpParams,
    });
  }

  deleteReview(id: string): Observable<unknown> {
    return this.http.delete(`/api/admin/reviews/${id}`);
  }

  // Categories
  getCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>('/api/admin/categories');
  }
}

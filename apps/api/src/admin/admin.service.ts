import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { UsersQueryDto, BookingsQueryDto, ReviewsQueryDto } from './dto/admin-query.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats() {
    const [masters, clients, bookingCounts, reviews, ratingAgg] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.MASTER } }),
      this.prisma.user.count({ where: { role: Role.CLIENT } }),
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.review.count(),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
    ]);

    const byStatus = Object.fromEntries(
      bookingCounts.map((b) => [b.status.toLowerCase(), b._count.status])
    );

    return {
      masters,
      clients,
      bookings: {
        total: Object.values(byStatus).reduce((s: number, v) => s + (v as number), 0),
        pending:   byStatus['pending']   ?? 0,
        confirmed: byStatus['confirmed'] ?? 0,
        completed: byStatus['completed'] ?? 0,
        cancelled: byStatus['cancelled'] ?? 0,
      },
      reviews,
      avgRating: ratingAgg._avg.rating != null
        ? Math.round(ratingAgg._avg.rating * 10) / 10
        : null,
    };
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async getUsers(dto: UsersQueryDto) {
    const { page = 1, limit = 20, role, search } = dto;
    const skip = (page - 1) * limit;

    const where: Parameters<typeof this.prisma.user.findMany>[0]['where'] = {};
    if (role)   where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, createdAt: true, isBanned: true,
          _count: { select: { services: true, bookingsAsClient: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async banUser(adminId: string, targetId: string) {
    if (adminId === targetId) {
      throw new ForbiddenException('Cannot ban yourself');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: targetId },
      data: { isBanned: true },
      select: { id: true, isBanned: true },
    });
  }

  async unbanUser(targetId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: targetId },
      data: { isBanned: false },
      select: { id: true, isBanned: true },
    });
  }

  // ── Bookings ───────────────────────────────────────────────────────────────

  async getBookings(dto: BookingsQueryDto) {
    const { page = 1, limit = 20, status, minPrice, maxPrice, dateFrom, dateTo, masterId, clientId } = dto;
    const skip = (page - 1) * limit;

    const where: Parameters<typeof this.prisma.booking.findMany>[0]['where'] = {};
    if (status)   where.status = status;
    if (masterId) where.masterId = masterId;
    if (clientId) where.clientId = clientId;
    if (minPrice != null || maxPrice != null) {
      where.estimatedPrice = {
        ...(minPrice != null && { gte: minPrice }),
        ...(maxPrice != null && { lte: maxPrice }),
      };
    }
    if (dateFrom || dateTo) {
      where.startTime = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo   && { lte: new Date(dateTo) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        select: {
          id: true, status: true, startTime: true, endTime: true, createdAt: true,
          estimatedPrice: true, actualPrice: true, note: true, address: true,
          client:  { select: { id: true, firstName: true, lastName: true, email: true } },
          master:  { select: { id: true, firstName: true, lastName: true, email: true } },
          service: { select: { id: true, name: true, price: true } },
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: data.map((b) => ({
        ...b,
        estimatedPrice: b.estimatedPrice != null ? Number(b.estimatedPrice) : null,
        actualPrice:    b.actualPrice    != null ? Number(b.actualPrice)    : null,
        service: { ...b.service, price: Number(b.service.price) },
      })),
      total, page, limit,
    };
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  async getReviews(dto: ReviewsQueryDto) {
    const { page = 1, limit = 20, minRating, maxRating } = dto;
    const skip = (page - 1) * limit;

    const where: Parameters<typeof this.prisma.review.findMany>[0]['where'] = {};
    if (minRating != null || maxRating != null) {
      where.rating = {
        ...(minRating != null && { gte: minRating }),
        ...(maxRating != null && { lte: maxRating }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true, startTime: true,
              client: { select: { firstName: true, lastName: true, email: true } },
              master: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Review deleted' };
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories() {
    return this.prisma.serviceCategory.findMany({
      include: {
        _count: { select: { services: true, masterCategories: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a review for a COMPLETED booking.
   * Rules:
   *  - Booking must exist and be COMPLETED
   *  - Caller must be the booking's client
   *  - Only one review per booking (enforced by UNIQUE constraint + guard)
   */
  async create(clientId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.clientId !== clientId) {
      throw new ForbiddenException('You can only review your own bookings');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('You can only review completed bookings');
    }
    if (booking.review) {
      throw new ConflictException('This booking already has a review');
    }

    return this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  /** Get the review for a specific booking (null if none yet). */
  async findByBooking(bookingId: string) {
    return this.prisma.review.findUnique({ where: { bookingId } });
  }

  /**
   * Return all reviews for a master, ordered newest-first.
   * The master is identified by slug or UUID (same logic as MastersService.findOne).
   */
  async findByMaster(slugOrId: string) {
    // Resolve master profile → user id
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let masterId: string | null = null;

    const bySlug = await this.prisma.masterProfile.findUnique({
      where: { slug: slugOrId },
      select: { userId: true },
    });
    if (bySlug) {
      masterId = bySlug.userId;
    } else if (UUID_RE.test(slugOrId)) {
      const byId = await this.prisma.masterProfile.findUnique({
        where: { userId: slugOrId },
        select: { userId: true },
      });
      if (byId) masterId = byId.userId;
    }

    if (!masterId) {
      throw new NotFoundException('Master not found');
    }

    return this.prisma.review.findMany({
      where: {
        booking: { masterId },
      },
      include: {
        booking: {
          select: {
            client: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

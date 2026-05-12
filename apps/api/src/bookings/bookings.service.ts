import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';

// ─── Prisma result types ──────────────────────────────────────────────────────

// The shape returned by booking queries that include service, client, master.
type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    service: true;
    client: { select: { id: true; firstName: true; lastName: true; email: true; phone: true } };
    master: { select: { id: true; firstName: true; lastName: true; email: true; phone: true; avatar: true } };
  };
}>;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Converts Prisma Decimal fields to numbers so JSON responses always
   * contain numeric values instead of strings.
   */
  private serializeBooking(booking: BookingWithRelations) {
    return {
      ...booking,
      estimatedPrice: booking.estimatedPrice != null
        ? Number(booking.estimatedPrice)
        : null,
      actualPrice: booking.actualPrice != null
        ? Number(booking.actualPrice)
        : null,
    };
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(clientId: string, dto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { master: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.masterId === clientId) {
      throw new BadRequestException('You cannot book your own service');
    }

    const startTime = new Date(dto.startTime);

    if (startTime <= new Date()) {
      throw new BadRequestException('Booking time must be in the future');
    }

    // Validate against master's working hours if set
    const workingHours = service.master.workingHours as Record<
      string,
      { enabled: boolean; from: string; to: string }
    > | null;

    if (workingHours) {
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayKey = dayNames[startTime.getDay()];
      const day = workingHours[dayKey];

      if (!day?.enabled) {
        throw new BadRequestException('Time slot is outside master working hours');
      }

      const slotTime = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
      if (slotTime < day.from || slotTime >= day.to) {
        throw new BadRequestException('Time slot is outside master working hours');
      }
    }

    const endTime = new Date(
      startTime.getTime() + service.durationMinutes * 60000
    );

    // Check for overlapping bookings for this master
    const overlap = await this.prisma.booking.findFirst({
      where: {
        masterId: service.masterId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlap) {
      throw new BadRequestException(
        'This time slot is already booked. Please choose a different time.'
      );
    }

    const booking = await this.prisma.booking.create({
      data: {
        clientId,
        masterId: service.masterId,
        serviceId: dto.serviceId,
        startTime,
        endTime,
        address: dto.address,
        note: dto.note,
        // Snapshot of service.price at booking creation — frozen forever.
        estimatedPrice: service.price,
      },
      include: {
        service: true,
        client: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        master: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true },
        },
      },
    });

    this.emailService.sendNewBookingNotification(booking).catch((err) =>
      this.logger.error('Failed to send new booking notification', err)
    );

    return this.serializeBooking(booking);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findClientBookings(clientId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { clientId },
      include: {
        service: { include: { category: true } },
        master: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
            email: true,
          },
        },
        client: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return bookings.map((b) =>
      this.serializeBooking({
        ...b,
        master: {
          ...b.master,
          // Show master phone to client once booking exists (PENDING or CONFIRMED)
          phone: ['PENDING', 'CONFIRMED'].includes(b.status) ? b.master?.phone : null,
        },
      } as BookingWithRelations)
    );
  }

  async findMasterBookings(masterId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { masterId },
      include: {
        service: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        master: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return bookings.map((b) =>
      this.serializeBooking({
        ...b,
        client: {
          ...b.client,
          // Hide client phone and email until booking is CONFIRMED
          phone: b.status === 'CONFIRMED' ? b.client?.phone : null,
          email: b.status === 'CONFIRMED' ? b.client?.email : null,
        },
      } as BookingWithRelations)
    );
  }

  // ─── Update status ─────────────────────────────────────────────────────────

  async updateStatus(
    bookingId: string,
    userId: string,
    status: BookingStatus,
    actualPrice?: number
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { email: true, firstName: true } },
        master: { select: { email: true, firstName: true } },
        service: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Idempotency guard — before the state machine, for a clearer error message.
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking already completed');
    }

    // State machine: PENDING → CONFIRMED|CANCELLED, CONFIRMED → COMPLETED|CANCELLED
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new BadRequestException(
        `Cannot transition booking from ${booking.status} to ${status}`
      );
    }

    // Authorization
    if (status === BookingStatus.CANCELLED) {
      if (booking.clientId !== userId && booking.masterId !== userId) {
        throw new ForbiddenException();
      }
    } else {
      // CONFIRMED and COMPLETED — only the assigned master
      if (booking.masterId !== userId) {
        throw new ForbiddenException(
          'Only the master can confirm or complete bookings'
        );
      }
    }

    // Master cannot mark a booking as COMPLETED before its start time.
    if (status === BookingStatus.COMPLETED && booking.startTime > new Date()) {
      throw new BadRequestException(
        'Cannot complete a booking before its start time'
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        // actualPrice only stored on COMPLETED; ignored for other transitions.
        ...(status === BookingStatus.COMPLETED && actualPrice != null
          ? { actualPrice }
          : {}),
      },
      include: {
        service: true,
        client: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        master: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true },
        },
      },
    });

    this.emailService.sendBookingStatusUpdate(updated).catch((err) =>
      this.logger.error('Failed to send booking status update email', err)
    );

    return this.serializeBooking(updated);
  }
}

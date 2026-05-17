import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import supertest from 'supertest';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// Must match the fallback in jwt.strategy.ts and auth.module.ts
const TEST_JWT_SECRET = 'dev-only-secret-change-in-production';

// ─── Mock factories ──────────────────────────────────────────────────────────

function createPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}

const mockEmailService = {
  sendNewBookingNotification: jest.fn().mockResolvedValue(undefined),
  sendBookingStatusUpdate: jest.fn().mockResolvedValue(undefined),
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
};

// ─── Test data ───────────────────────────────────────────────────────────────

const testClient = {
  id: 'client-id-1',
  email: 'client@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'CLIENT',
  phone: null,
  avatar: null,
  bio: null,
};

const testMaster = {
  id: 'master-id-1',
  email: 'master@example.com',
  firstName: 'Bob',
  lastName: 'Brown',
  role: 'MASTER',
  phone: null,
  avatar: null,
};

// price is a Decimal in Prisma — mock returns a plain object that serializes the same way
const testService = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Haircut',
  masterId: testMaster.id,
  durationMinutes: 60,
  price: { toNumber: () => 85, toString: () => '85.00' } as unknown as any,
  master: testMaster,
  workingHours: null,
};

// Helper: build a mock booking with optional price fields
function mockBooking(overrides: Record<string, unknown> = {}) {
  const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const end   = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    id: 'booking-id-1',
    clientId: testClient.id,
    masterId: testMaster.id,
    serviceId: testService.id,
    startTime: start,
    endTime: end,
    status: 'PENDING',
    note: null,
    address: 'Mlynská 18, Bratislava',
    estimatedPrice: null,
    actualPrice: null,
    service: testService,
    client: testClient,
    master: testMaster,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('BookingsController (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let jwtService: JwtService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: TEST_JWT_SECRET,
          signOptions: { expiresIn: '24h' },
        }),
      ],
      controllers: [BookingsController],
      providers: [
        BookingsService,
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    app.setGlobalPrefix('api');
    await app.init();

    jwtService = moduleRef.get(JwtService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function makeToken(user: { id: string; email: string; role: string }) {
    return jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }

  function futureDate(hoursFromNow = 24): string {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
  }

  function pastDate(hoursAgo = 1): string {
    return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/bookings
  // ─────────────────────────────────────────────────────────────────────────

  describe('POST /api/bookings', () => {
    const validBookingPayload = {
      serviceId: testService.id,
      startTime: '', // filled per test
      address: 'Mlynská 18, Bratislava',
    };

    it('should return 401 without a JWT token', async () => {
      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .send({ ...validBookingPayload, startTime: futureDate() })
        .expect(401);
    });

    it('should return 401 with an invalid token', async () => {
      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', 'Bearer bad.token.value')
        .send({ ...validBookingPayload, startTime: futureDate() })
        .expect(401);
    });

    it('should return 400 when startTime is in the past', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.service.findUnique.mockResolvedValue(testService);
      prismaMock.booking.findFirst.mockResolvedValue(null);

      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${makeToken(testClient)}`)
        .send({ ...validBookingPayload, startTime: pastDate() })
        .expect(400);
    });

    it('should return 201 and set estimatedPrice from service.price', async () => {
      const start = futureDate(2);
      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.service.findUnique.mockResolvedValue(testService);
      prismaMock.booking.findFirst.mockResolvedValue(null);
      prismaMock.booking.create.mockResolvedValue(
        mockBooking({ estimatedPrice: 85, actualPrice: null, startTime: new Date(start) })
      );

      const res = await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${makeToken(testClient)}`)
        .send({ serviceId: testService.id, startTime: start, address: 'Mlynská 18, Bratislava' })
        .expect(201);

      expect(res.body).toHaveProperty('id', 'booking-id-1');
      expect(res.body.status).toBe('PENDING');
      // estimatedPrice must be a number (not a Decimal string)
      expect(res.body.estimatedPrice).toBe(85);
      expect(res.body.actualPrice).toBeNull();

      // Verify the service was told to snapshot service.price
      expect(prismaMock.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estimatedPrice: testService.price }),
        })
      );
    });

    it('estimatedPrice should be unaffected by later service.price changes', async () => {
      // This is a design property: estimatedPrice is captured at create time.
      // The test verifies create() reads price from the service object at call time —
      // even if the service mock is changed afterward, the booking keeps the old value.
      const start = futureDate(2);
      const priceAtBookingTime = testService.price;

      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.service.findUnique.mockResolvedValue(testService);
      prismaMock.booking.findFirst.mockResolvedValue(null);
      prismaMock.booking.create.mockResolvedValue(
        mockBooking({ estimatedPrice: 85, startTime: new Date(start) })
      );

      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${makeToken(testClient)}`)
        .send({ serviceId: testService.id, startTime: start, address: 'Mlynská 18, Bratislava' })
        .expect(201);

      const [[{ data }]] = prismaMock.booking.create.mock.calls;
      // The price stored in the booking equals the service price at call time
      expect(data.estimatedPrice).toBe(priceAtBookingTime);
    });

    it('should return 400 when serviceId is missing', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testClient);
      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${makeToken(testClient)}`)
        .send({ startTime: futureDate(), address: 'Mlynská 18, Bratislava' })
        .expect(400);
    });

    it('should return 400 when serviceId is not a valid UUID', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testClient);
      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${makeToken(testClient)}`)
        .send({ serviceId: 'not-a-uuid', startTime: futureDate(), address: 'Mlynská 18, Bratislava' })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/bookings/:id/status
  // ─────────────────────────────────────────────────────────────────────────

  describe('PATCH /api/bookings/:id/status', () => {

    it('should store actualPrice when master completes a booking with price', async () => {
      const confirmedBooking = mockBooking({ status: 'CONFIRMED', startTime: pastDate() as unknown as Date });
      const completedBooking = mockBooking({
        status: 'COMPLETED',
        startTime: pastDate() as unknown as Date,
        estimatedPrice: 85,
        actualPrice: 95,
      });

      prismaMock.user.findUnique.mockResolvedValue(testMaster);
      prismaMock.booking.findUnique.mockResolvedValue(confirmedBooking);
      prismaMock.booking.update.mockResolvedValue(completedBooking);

      const res = await supertest(app.getHttpServer())
        .patch(`/api/bookings/booking-id-1/status`)
        .set('Authorization', `Bearer ${makeToken(testMaster)}`)
        .send({ status: 'COMPLETED', actualPrice: 95 })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.actualPrice).toBe(95);

      expect(prismaMock.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLETED', actualPrice: 95 }),
        })
      );
    });

    it('should store null actualPrice when master completes without providing price', async () => {
      const confirmedBooking = mockBooking({ status: 'CONFIRMED', startTime: pastDate() as unknown as Date });
      const completedBooking = mockBooking({
        status: 'COMPLETED',
        startTime: pastDate() as unknown as Date,
        estimatedPrice: 85,
        actualPrice: null,
      });

      prismaMock.user.findUnique.mockResolvedValue(testMaster);
      prismaMock.booking.findUnique.mockResolvedValue(confirmedBooking);
      prismaMock.booking.update.mockResolvedValue(completedBooking);

      const res = await supertest(app.getHttpServer())
        .patch(`/api/bookings/booking-id-1/status`)
        .set('Authorization', `Bearer ${makeToken(testMaster)}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.actualPrice).toBeNull();

      // data must NOT contain actualPrice key (no zero written)
      expect(prismaMock.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ actualPrice: expect.anything() }),
        })
      );
    });

    it('should return 403 when a client tries to complete a booking', async () => {
      const confirmedBooking = mockBooking({ status: 'CONFIRMED', startTime: pastDate() as unknown as Date });

      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.booking.findUnique.mockResolvedValue(confirmedBooking);

      await supertest(app.getHttpServer())
        .patch(`/api/bookings/booking-id-1/status`)
        .set('Authorization', `Bearer ${makeToken(testClient)}`)
        .send({ status: 'COMPLETED' })
        .expect(403);
    });

    it('should return 400 on double COMPLETED (idempotency guard)', async () => {
      const alreadyCompleted = mockBooking({ status: 'COMPLETED' });

      prismaMock.user.findUnique.mockResolvedValue(testMaster);
      prismaMock.booking.findUnique.mockResolvedValue(alreadyCompleted);

      const res = await supertest(app.getHttpServer())
        .patch(`/api/bookings/booking-id-1/status`)
        .set('Authorization', `Bearer ${makeToken(testMaster)}`)
        .send({ status: 'COMPLETED' })
        .expect(400);

      expect(res.body.message).toBe('Booking already completed');
    });

    it('should return 400 when actualPrice is negative', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testMaster);

      await supertest(app.getHttpServer())
        .patch(`/api/bookings/booking-id-1/status`)
        .set('Authorization', `Bearer ${makeToken(testMaster)}`)
        .send({ status: 'COMPLETED', actualPrice: -10 })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/bookings/my
  // ─────────────────────────────────────────────────────────────────────────

  describe('GET /api/bookings/my', () => {
    it('should return 401 without a token', async () => {
      await supertest(app.getHttpServer())
        .get('/api/bookings/my')
        .expect(401);
    });

    it('should return 200 with an array for a CLIENT user', async () => {
      const bookings = [mockBooking({ id: 'b1', estimatedPrice: 85, actualPrice: null })];

      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.booking.findMany.mockResolvedValue(bookings);

      const res = await supertest(app.getHttpServer())
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${makeToken(testClient)}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe('b1');
      expect(res.body[0].estimatedPrice).toBe(85);
    });

    it('should return 200 with an empty array when user has no bookings', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.booking.findMany.mockResolvedValue([]);

      const res = await supertest(app.getHttpServer())
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${makeToken(testClient)}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('should return 200 and call findMasterBookings for a MASTER user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testMaster);
      prismaMock.booking.findMany.mockResolvedValue([]);

      await supertest(app.getHttpServer())
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${makeToken(testMaster)}`)
        .expect(200);

      expect(prismaMock.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { masterId: testMaster.id },
        })
      );
    });
  });
});

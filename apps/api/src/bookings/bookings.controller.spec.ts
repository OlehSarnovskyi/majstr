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
};

const testService = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Haircut',
  masterId: testMaster.id,
  durationMinutes: 60,
  master: testMaster,
};

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
      prismaMock.booking.findFirst.mockResolvedValue(null); // No overlap

      const token = makeToken(testClient);

      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ serviceId: testService.id, startTime: pastDate() })
        .expect(400);
    });

    it('should return 201 with booking data when request is valid', async () => {
      const start = futureDate(2);
      const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
      const mockBooking = {
        id: 'booking-id-1',
        clientId: testClient.id,
        masterId: testMaster.id,
        serviceId: testService.id,
        startTime: new Date(start),
        endTime: new Date(end),
        status: 'PENDING',
        note: null,
        service: testService,
        client: testClient,
        master: testMaster,
      };

      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.service.findUnique.mockResolvedValue(testService);
      prismaMock.booking.findFirst.mockResolvedValue(null);
      prismaMock.booking.create.mockResolvedValue(mockBooking);

      const token = makeToken(testClient);

      const res = await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ serviceId: testService.id, startTime: start })
        .expect(201);

      expect(res.body).toHaveProperty('id', 'booking-id-1');
      expect(res.body.status).toBe('PENDING');
    });

    it('should return 400 when serviceId is missing', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testClient);

      const token = makeToken(testClient);

      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ startTime: futureDate() })
        .expect(400);
    });

    it('should return 400 when serviceId is not a valid UUID', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testClient);

      const token = makeToken(testClient);

      await supertest(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ serviceId: 'not-a-uuid', startTime: futureDate() })
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
      const mockBookings = [
        {
          id: 'b1',
          serviceId: testService.id,
          clientId: testClient.id,
          masterId: testMaster.id,
          startTime: new Date(),
          endTime: new Date(),
          status: 'PENDING',
          service: { ...testService, category: { id: 'cat-1', name: 'Hair' } },
          master: testMaster,
        },
      ];

      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.booking.findMany.mockResolvedValue(mockBookings);

      const token = makeToken(testClient);

      const res = await supertest(app.getHttpServer())
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe('b1');
    });

    it('should return 200 with an empty array when user has no bookings', async () => {
      prismaMock.user.findUnique.mockResolvedValue(testClient);
      prismaMock.booking.findMany.mockResolvedValue([]);

      const token = makeToken(testClient);

      const res = await supertest(app.getHttpServer())
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('should return 200 and call findMasterBookings for a MASTER user', async () => {
      const masterUser = { ...testMaster, phone: null, avatar: null, bio: null };
      prismaMock.user.findUnique.mockResolvedValue(masterUser);
      prismaMock.booking.findMany.mockResolvedValue([]);

      const token = makeToken(testMaster);

      const res = await supertest(app.getHttpServer())
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // Verify the query was called with masterId (not clientId)
      expect(prismaMock.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { masterId: testMaster.id },
        })
      );
    });
  });
});

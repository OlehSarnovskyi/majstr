import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import supertest from 'supertest';
import * as bcrypt from 'bcrypt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// Must match the fallback in jwt.strategy.ts and auth.module.ts
const TEST_JWT_SECRET = 'dev-only-secret-change-in-production';

// ─── Prisma mock factory ────────────────────────────────────────────────────

function createPrismaUserMock() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };
}

function createPrismaMock() {
  return {
    user: createPrismaUserMock(),
    booking: { deleteMany: jest.fn() },
    service: { deleteMany: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}

// ─── Email service mock ─────────────────────────────────────────────────────

const mockEmailService = {
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendNewBookingNotification: jest.fn().mockResolvedValue(undefined),
  sendBookingStatusUpdate: jest.fn().mockResolvedValue(undefined),
};

// ─── Shared test user data ───────────────────────────────────────────────────

const existingUserPassword = 'password123';
let existingUserHash: string;

const existingUser = {
  id: 'user-uuid-1',
  email: 'existing@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'CLIENT',
  roleChosen: true,
  phone: null,
  avatar: null,
  bio: null,
  googleId: null,
  emailVerified: true, // verified so login tests can pass
  emailVerificationToken: null,
  resetToken: null,
  resetTokenExpiry: null,
  password: '', // filled in beforeAll
};

// ─── Test suite ─────────────────────────────────────────────────────────────

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let jwtService: JwtService;

  beforeAll(async () => {
    existingUserHash = await bcrypt.hash(existingUserPassword, 10);
    existingUser.password = existingUserHash;
  });

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
      controllers: [AuthController],
      providers: [
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

    // Reset mocks between tests
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  // ── Helper ──────────────────────────────────────────────────────────────

  function makeToken(user: { id: string; email: string; role: string }) {
    return jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/auth/register
  // ─────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    const registerPayload = {
      email: 'newuser@example.com',
      password: 'secret123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should return 201 with a message (no token — user must verify email first)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
      prismaMock.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: registerPayload.email,
        firstName: registerPayload.firstName,
        lastName: registerPayload.lastName,
        role: 'CLIENT',
        roleChosen: false,
        password: 'hashed',
        phone: null,
        avatar: null,
        bio: null,
        googleId: null,
        emailVerified: false,
        emailVerificationToken: 'tok',
        resetToken: null,
        resetTokenExpiry: null,
      });

      const res = await supertest(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerPayload)
        .expect(201);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('email', registerPayload.email);
      expect(res.body).not.toHaveProperty('accessToken');
    });

    it('should return 409 when a user with that email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      await supertest(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...registerPayload, email: existingUser.email })
        .expect(409);
    });

    it('should return 400 when required fields are missing', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'bad@example.com' })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/auth/login
  // ─────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('should return 200 with accessToken on correct credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      const res = await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: existingUserPassword })
        .expect(201); // NestJS @Post returns 201 by default

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe(existingUser.email);
    });

    it('should return 401 on wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever123' })
        .expect(401);
    });

    it('should return 400 when email is missing', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/auth/me
  // ─────────────────────────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('should return 401 without a Bearer token', async () => {
      await supertest(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 with an invalid/expired token', async () => {
      await supertest(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should return 200 with user data when token is valid', async () => {
      const profileUser = {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        phone: null,
        avatar: null,
        bio: null,
        role: existingUser.role,
      };
      prismaMock.user.findUnique.mockResolvedValue(profileUser);

      const token = makeToken(existingUser);

      const res = await supertest(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe(existingUser.email);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/auth/forgot-password
  // ─────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/forgot-password', () => {
    it('should return 200 for an existing email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      prismaMock.user.update.mockResolvedValue(existingUser);

      const res = await supertest(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: existingUser.email })
        .expect(201); // NestJS @Post returns 201 by default

      expect(res.body).toHaveProperty('message');
    });

    it('should return 201 even for a non-existent email (no enumeration)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await supertest(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' })
        .expect(201);

      expect(res.body.message).toContain('Reset link');
    });

    it('should return 400 when email is missing', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { Reflector } from '@nestjs/core';
import { MastersController } from './masters.controller';
import { MastersService } from './masters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, ROLES_KEY } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock factories ──────────────────────────────────────────────────────────

function createPrismaMock() {
  return {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    masterProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

// ─── Test data ───────────────────────────────────────────────────────────────

const masterUser = {
  id: 'master-user-uuid-1',
  email: 'master@example.com',
  role: 'MASTER',
};

const clientUser = {
  id: 'client-user-uuid-1',
  email: 'client@example.com',
  role: 'CLIENT',
};

const sampleProfile = {
  id: 'profile-uuid-1',
  slug: 'jan-novak',
  description: 'Skúsený inštalatér',
  isVerified: false,
  createdAt: new Date('2024-01-01'),
  user: {
    id: masterUser.id,
    firstName: 'Ján',
    lastName: 'Novák',
    avatar: null,
    bio: null,
    city: 'Bratislava',
    workingHours: null,
    services: [],
  },
};

// ─── Guard helpers ────────────────────────────────────────────────────────────

/**
 * Builds a fake JwtAuthGuard that injects `reqUser` into the request.
 * Set `reqUser = null` to simulate a missing / invalid token (→ 401).
 */
function makeAuthGuard(reqUser: object | null) {
  return {
    canActivate: (ctx: import('@nestjs/common').ExecutionContext) => {
      if (!reqUser) return false; // triggers 403; for true 401 we'd throw — see note below
      ctx.switchToHttp().getRequest().user = reqUser;
      return true;
    },
  };
}

/**
 * Roles guard that reads the @Roles() metadata and checks req.user.role.
 * Mirrors the real RolesGuard so we can test 403 without Passport.
 */
const fakeRolesGuard = {
  canActivate: (ctx: import('@nestjs/common').ExecutionContext) => {
    const reflector = new Reflector();
    const required = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;
    const { user } = ctx.switchToHttp().getRequest();
    return required.some((r) => r === user?.role);
  },
};

// ─── App builder ─────────────────────────────────────────────────────────────

async function buildApp(
  prismaMock: ReturnType<typeof createPrismaMock>,
  reqUser: object | null = masterUser,
): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [MastersController],
    providers: [
      MastersService,
      Reflector,
      { provide: PrismaService, useValue: prismaMock },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(makeAuthGuard(reqUser))
    .overrideGuard(RolesGuard)
    .useValue(fakeRolesGuard)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MastersController', () => {
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  // ── GET /masters ───────────────────────────────────────────────────────────

  describe('GET /masters', () => {
    it('returns list of masters', async () => {
      prisma.user.findMany.mockResolvedValue([masterUser]);
      const app = await buildApp(prisma);
      const res = await supertest(app.getHttpServer()).get('/masters').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      await app.close();
    });
  });

  // ── GET /masters/cities ───────────────────────────────────────────────────

  describe('GET /masters/cities', () => {
    it('returns distinct cities', async () => {
      prisma.user.findMany.mockResolvedValue([{ city: 'Bratislava' }, { city: 'Košice' }]);
      const app = await buildApp(prisma);
      const res = await supertest(app.getHttpServer()).get('/masters/cities').expect(200);
      expect(res.body).toEqual(['Bratislava', 'Košice']);
      await app.close();
    });
  });

  // ── GET /masters/profile/me ───────────────────────────────────────────────

  describe('GET /masters/profile/me', () => {
    it('returns profile for authenticated master', async () => {
      prisma.masterProfile.findUnique.mockResolvedValue(sampleProfile);
      const app = await buildApp(prisma, masterUser);

      const res = await supertest(app.getHttpServer())
        .get('/masters/profile/me')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(res.body.slug).toBe('jan-novak');
      await app.close();
    });

    it('returns null when master has no profile yet', async () => {
      prisma.masterProfile.findUnique.mockResolvedValue(null);
      const app = await buildApp(prisma, masterUser);

      const res = await supertest(app.getHttpServer())
        .get('/masters/profile/me')
        .set('Authorization', 'Bearer token')
        .expect(200);

      // NestJS serialises null as an empty body; supertest parses that as {}
      expect(Object.keys(res.body).length).toBe(0);
      await app.close();
    });
  });

  // ── POST /masters/profile ─────────────────────────────────────────────────

  describe('POST /masters/profile', () => {
    it('returns 403 for CLIENT role', async () => {
      const app = await buildApp(prisma, clientUser);

      await supertest(app.getHttpServer())
        .post('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ slug: 'jan-novak' })
        .expect(403);

      await app.close();
    });

    it('creates profile for MASTER', async () => {
      prisma.masterProfile.findUnique
        .mockResolvedValueOnce(null)  // no existing profile
        .mockResolvedValueOnce(null); // slug is free
      prisma.masterProfile.create.mockResolvedValue(sampleProfile);

      const app = await buildApp(prisma, masterUser);
      const res = await supertest(app.getHttpServer())
        .post('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ slug: 'jan-novak', description: 'Skúsený inštalatér' })
        .expect(201);

      expect(res.body.slug).toBe('jan-novak');
      await app.close();
    });

    it('returns 409 when profile already exists', async () => {
      prisma.masterProfile.findUnique.mockResolvedValueOnce(sampleProfile);
      const app = await buildApp(prisma, masterUser);

      await supertest(app.getHttpServer())
        .post('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ slug: 'jan-novak' })
        .expect(409);

      await app.close();
    });

    it('returns 409 when slug is already taken by another master', async () => {
      prisma.masterProfile.findUnique
        .mockResolvedValueOnce(null)                      // no own profile
        .mockResolvedValueOnce({ id: 'other-profile' }); // slug taken

      const app = await buildApp(prisma, masterUser);
      await supertest(app.getHttpServer())
        .post('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ slug: 'jan-novak' })
        .expect(409);

      await app.close();
    });

    it('returns 400 for invalid slug (uppercase letters)', async () => {
      const app = await buildApp(prisma, masterUser);
      await supertest(app.getHttpServer())
        .post('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ slug: 'Jan-Novak' })
        .expect(400);
      await app.close();
    });

    it('returns 400 for slug with leading hyphen', async () => {
      const app = await buildApp(prisma, masterUser);
      await supertest(app.getHttpServer())
        .post('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ slug: '-jan-novak' })
        .expect(400);
      await app.close();
    });

    it('returns 400 when slug is missing', async () => {
      const app = await buildApp(prisma, masterUser);
      await supertest(app.getHttpServer())
        .post('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ description: 'no slug here' })
        .expect(400);
      await app.close();
    });
  });

  // ── PATCH /masters/profile ────────────────────────────────────────────────

  describe('PATCH /masters/profile', () => {
    it('updates description', async () => {
      const updated = { ...sampleProfile, description: 'Updated' };
      prisma.masterProfile.findUnique.mockResolvedValueOnce(sampleProfile);
      prisma.masterProfile.update.mockResolvedValue(updated);

      const app = await buildApp(prisma, masterUser);
      const res = await supertest(app.getHttpServer())
        .patch('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ description: 'Updated' })
        .expect(200);

      expect(res.body.description).toBe('Updated');
      await app.close();
    });

    it('returns 404 when profile does not exist', async () => {
      prisma.masterProfile.findUnique.mockResolvedValueOnce(null);
      const app = await buildApp(prisma, masterUser);

      await supertest(app.getHttpServer())
        .patch('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ description: 'x' })
        .expect(404);

      await app.close();
    });

    it('returns 409 when new slug is already taken', async () => {
      prisma.masterProfile.findUnique
        .mockResolvedValueOnce(sampleProfile)                           // own profile
        .mockResolvedValueOnce({ id: 'other', userId: 'other-user' }); // slug taken

      const app = await buildApp(prisma, masterUser);
      await supertest(app.getHttpServer())
        .patch('/masters/profile')
        .set('Authorization', 'Bearer token')
        .send({ slug: 'other-slug' })
        .expect(409);

      await app.close();
    });
  });

  // ── GET /masters/slug/check ───────────────────────────────────────────────

  describe('GET /masters/slug/check', () => {
    it('returns available: true for a free slug', async () => {
      prisma.masterProfile.findUnique.mockResolvedValue(null);
      const app = await buildApp(prisma);

      const res = await supertest(app.getHttpServer())
        .get('/masters/slug/check?slug=free-slug')
        .expect(200);

      expect(res.body).toEqual({ slug: 'free-slug', available: true });
      await app.close();
    });

    it('returns available: false for a taken slug', async () => {
      prisma.masterProfile.findUnique.mockResolvedValue({ userId: 'other-user' });
      const app = await buildApp(prisma);

      const res = await supertest(app.getHttpServer())
        .get('/masters/slug/check?slug=taken-slug')
        .expect(200);

      expect(res.body).toEqual({ slug: 'taken-slug', available: false });
      await app.close();
    });

    it('returns available: true when slug belongs to the requesting user', async () => {
      prisma.masterProfile.findUnique.mockResolvedValue({ userId: masterUser.id });
      const app = await buildApp(prisma);

      const res = await supertest(app.getHttpServer())
        .get(`/masters/slug/check?slug=jan-novak&userId=${masterUser.id}`)
        .expect(200);

      expect(res.body).toEqual({ slug: 'jan-novak', available: true });
      await app.close();
    });
  });

  // ── GET /masters/:slug ────────────────────────────────────────────────────

  describe('GET /masters/:slug', () => {
    it('resolves by slug', async () => {
      prisma.masterProfile.findUnique.mockResolvedValue(sampleProfile);
      const app = await buildApp(prisma);

      const res = await supertest(app.getHttpServer())
        .get('/masters/jan-novak')
        .expect(200);

      expect(res.body.slug).toBe('jan-novak');
      await app.close();
    });

    it('resolves by legacy UUID (UUID fallback)', async () => {
      const uuid = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
      prisma.masterProfile.findUnique
        .mockResolvedValueOnce(null)          // by slug → miss
        .mockResolvedValueOnce(sampleProfile); // by userId → hit

      const app = await buildApp(prisma);
      const res = await supertest(app.getHttpServer())
        .get(`/masters/${uuid}`)
        .expect(200);

      expect(res.body.slug).toBe('jan-novak');
      await app.close();
    });

    it('returns 404 when not found', async () => {
      prisma.masterProfile.findUnique.mockResolvedValue(null);
      const app = await buildApp(prisma);

      await supertest(app.getHttpServer())
        .get('/masters/nonexistent-slug')
        .expect(404);

      await app.close();
    });
  });
});

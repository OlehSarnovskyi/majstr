import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import { CreateMasterProfileDto } from './dto/create-master-profile.dto';
import { UpdateMasterProfileDto } from './dto/update-master-profile.dto';

/** UUID v4 pattern — used to detect legacy UUID-based lookups */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Fields included in every public master-profile response */
const PROFILE_SELECT = {
  id: true,
  slug: true,
  description: true,
  isVerified: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      city: true,
      workingHours: true,
      services: {
        include: { category: true },
        orderBy: { createdAt: 'desc' as const },
      },
    },
  },
} satisfies Prisma.MasterProfileSelect;

@Injectable()
export class MastersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public master listing ────────────────────────────────────────────────

  async findAll(filters?: { city?: string; search?: string }) {
    const where: Prisma.UserWhereInput = {
      role: Role.MASTER,
      services: { some: {} },
    };

    if (filters?.city) {
      where.city = { equals: filters.city, mode: 'insensitive' };
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName:  { contains: filters.search, mode: 'insensitive' } },
        { services: { some: { name: { contains: filters.search, mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        city: true,
        masterProfile: { select: { slug: true } },
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll_cities() {
    const masters = await this.prisma.user.findMany({
      where: { role: Role.MASTER, services: { some: {} }, city: { not: null } },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return masters.map((m) => m.city).filter(Boolean) as string[];
  }

  /**
   * Look up a master by slug (preferred) or by legacy user UUID.
   *
   * TODO: Remove UUID fallback after all masters have a slug (v2).
   */
  async findOne(slugOrId: string) {
    // Try slug first
    const bySlug = await this.prisma.masterProfile.findUnique({
      where: { slug: slugOrId },
      select: PROFILE_SELECT,
    });
    if (bySlug) return bySlug;

    // UUID fallback — kept for backwards compatibility with old links
    if (UUID_RE.test(slugOrId)) {
      const byId = await this.prisma.masterProfile.findUnique({
        where: { userId: slugOrId },
        select: PROFILE_SELECT,
      });
      if (byId) return byId;
    }

    throw new NotFoundException('Master not found');
  }

  // ── Profile management (authenticated) ──────────────────────────────────

  /** Return the caller's own MasterProfile (null if not created yet). */
  async getMyProfile(userId: string) {
    return this.prisma.masterProfile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    });
  }

  /** Create a MasterProfile for the authenticated MASTER user. */
  async createProfile(userId: string, dto: CreateMasterProfileDto) {
    // Guard: profile must not already exist
    const existing = await this.prisma.masterProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('You already have a master profile');
    }

    // Guard: slug must be unique
    await this.assertSlugFree(dto.slug);

    return this.prisma.masterProfile.create({
      data: {
        userId,
        slug: dto.slug,
        description: dto.description,
      },
      select: PROFILE_SELECT,
    });
  }

  /** Update the authenticated MASTER's profile (slug and/or description). */
  async updateProfile(userId: string, dto: UpdateMasterProfileDto) {
    const profile = await this.prisma.masterProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Master profile not found');
    }

    // Only validate slug uniqueness if it actually changes
    if (dto.slug && dto.slug !== profile.slug) {
      await this.assertSlugFree(dto.slug);
    }

    return this.prisma.masterProfile.update({
      where: { userId },
      data: {
        ...(dto.slug        !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      select: PROFILE_SELECT,
    });
  }

  /** Check whether a slug is available.  Returns `{ available: boolean, slug: string }`. */
  async checkSlugAvailability(slug: string, excludeUserId?: string) {
    const existing = await this.prisma.masterProfile.findUnique({
      where: { slug },
      select: { userId: true },
    });

    const available =
      existing === null || (!!excludeUserId && existing.userId === excludeUserId);

    return { slug, available };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async assertSlugFree(slug: string) {
    const taken = await this.prisma.masterProfile.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException(`Slug "${slug}" is already taken`);
    }
  }
}

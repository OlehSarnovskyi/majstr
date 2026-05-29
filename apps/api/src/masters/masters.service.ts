import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import { CreateMasterProfileDto } from './dto/create-master-profile.dto';
import { UpdateMasterProfileDto } from './dto/update-master-profile.dto';
import { SetMasterCategoriesDto } from './dto/set-master-categories.dto';
import { ReviewsService } from '../reviews/reviews.service';
import { EmailService } from '../email/email.service';

/** UUID v4 pattern — used to detect legacy UUID-based lookups */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Category shape reused across selects */
const CATEGORY_SELECT = { select: { id: true, name: true, slug: true, icon: true } } as const;

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
      city: { select: { id: true, name: true, slug: true } },
      workingHours: true,
      timezone: true,
      services: {
        include: { category: true },
        orderBy: { createdAt: 'desc' as const },
      },
      masterCategories: {
        include: { category: CATEGORY_SELECT },
        orderBy: { category: { name: 'asc' as const } },
      },
    },
  },
} satisfies Prisma.MasterProfileSelect;

/** Same as PROFILE_SELECT but includes phone — only for the owner's own profile */
const MY_PROFILE_SELECT = {
  ...PROFILE_SELECT,
  user: {
    select: {
      ...PROFILE_SELECT.user.select,
      phone: true,
    },
  },
} satisfies Prisma.MasterProfileSelect;

@Injectable()
export class MastersService {
  private readonly logger = new Logger(MastersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsService: ReviewsService,
    private readonly emailService: EmailService,
  ) {}

  // ── Public master listing ────────────────────────────────────────────────

  async findAll(filters?: { city?: string; category?: string; search?: string }) {
    const where: Prisma.UserWhereInput = {
      role: Role.MASTER,
      services: { some: {} }, // hide masters with no services — nothing to book
    };

    if (filters?.city) {
      const citySlug = filters.city.toLowerCase();
      const city = await this.prisma.city.findUnique({ where: { slug: citySlug } });
      if (!city) throw new NotFoundException(`City '${citySlug}' not found`);
      where.cityId = city.id;
    }

    if (filters?.category) {
      const categorySlug = filters.category.toLowerCase();
      const cat = await this.prisma.serviceCategory.findUnique({ where: { slug: categorySlug } });
      if (!cat) throw new NotFoundException(`Category '${categorySlug}' not found`);
      where.masterCategories = { some: { categoryId: cat.id } };
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName:  { contains: filters.search, mode: 'insensitive' } },
        { services:  { some: { name: { contains: filters.search, mode: 'insensitive' } } } },
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
        city: { select: { id: true, name: true, slug: true } },
        masterProfile: { select: { slug: true } },
        masterCategories: {
          include: { category: CATEGORY_SELECT },
          orderBy: { category: { name: 'asc' as const } },
        },
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll_cities() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, country: true },
      orderBy: { name: 'asc' },
    });
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
    if (bySlug) return this.attachRatingStats(bySlug);

    // UUID fallback — kept for backwards compatibility with old links
    if (UUID_RE.test(slugOrId)) {
      const byId = await this.prisma.masterProfile.findUnique({
        where: { userId: slugOrId },
        select: PROFILE_SELECT,
      });
      if (byId) return this.attachRatingStats(byId);
    }

    throw new NotFoundException('Master not found');
  }

  /** Fetch reviews for a master (public). */
  getReviewsForMaster(slugOrId: string) {
    return this.reviewsService.findByMaster(slugOrId);
  }

  /** Compute and attach averageRating + reviewCount to a profile object. */
  private async attachRatingStats<T extends { user: { id: string } }>(profile: T) {
    const agg = await this.prisma.review.aggregate({
      where: { booking: { masterId: profile.user.id } },
      _avg:   { rating: true },
      _count: { rating: true },
    });
    return {
      ...profile,
      averageRating: agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null,
      reviewCount:   agg._count.rating,
    };
  }

  // ── Profile management (authenticated) ──────────────────────────────────

  /** Return the caller's own MasterProfile (null if not created yet). */
  async getMyProfile(userId: string) {
    return this.prisma.masterProfile.findUnique({
      where: { userId },
      select: MY_PROFILE_SELECT,
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

    const profile = await this.prisma.masterProfile.create({
      data: {
        userId,
        slug: dto.slug,
        description: dto.description,
      },
      select: PROFILE_SELECT,
    });

    // Fetch the user's email for the welcome email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    if (user) {
      this.emailService.sendWelcomeMaster({
        user: { firstName: user.firstName, email: user.email },
        slug: dto.slug,
      }).catch((err) => this.logger.error('Welcome master email failed', err));
    }

    return profile;
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
        // timezone lives on the User record — update via nested write
        ...(dto.timezone    !== undefined && { user: { update: { timezone: dto.timezone } } }),
      },
      select: PROFILE_SELECT,
    });
  }

  /**
   * Set (replace) master specialization categories.
   * Validates 1-3 categories, verifies all UUIDs exist, then does a full replace
   * (deleteMany + createMany) in a transaction — idempotent.
   */
  async setCategories(masterId: string, dto: SetMasterCategoriesDto) {
    // Validate all categoryIds exist
    const found = await this.prisma.serviceCategory.findMany({
      where: { id: { in: dto.categoryIds } },
      select: { id: true },
    });
    if (found.length !== dto.categoryIds.length) {
      throw new BadRequestException('Niektoré kategórie neexistujú');
    }

    // Full replace in a transaction
    await this.prisma.$transaction([
      this.prisma.masterCategory.deleteMany({ where: { masterId } }),
      this.prisma.masterCategory.createMany({
        data: dto.categoryIds.map((categoryId) => ({ masterId, categoryId })),
      }),
    ]);

    // Return updated profile
    return this.prisma.masterProfile.findUnique({
      where: { userId: masterId },
      select: PROFILE_SELECT,
    });
  }

  /**
   * Generate a unique slug from firstName + lastName.
   * If "jan-novak" is taken, tries "jan-novak-2", "jan-novak-3", etc.
   * Excludes the current user's own profile so renaming keeps the same base.
   */
  async generateUniqueSlug(firstName: string, lastName: string, excludeUserId?: string): Promise<string> {
    const base = `${firstName}-${lastName}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')   // strip diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let candidate = base;
    let i = 2;
    while (true) {
      const taken = await this.prisma.masterProfile.findUnique({
        where: { slug: candidate },
        select: { userId: true },
      });
      if (!taken || (excludeUserId && taken.userId === excludeUserId)) {
        return candidate;
      }
      candidate = `${base}-${i++}`;
    }
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

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { MastersService } from './masters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { CreateMasterProfileDto } from './dto/create-master-profile.dto';
import { UpdateMasterProfileDto } from './dto/update-master-profile.dto';
import { SetMasterCategoriesDto } from './dto/set-master-categories.dto';

@SkipThrottle()
@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  // ── Public listing ───────────────────────────────────────────────────────

  @Get()
  findAll(
    @Query('city')     city?: string,
    @Query('category') category?: string,
    @Query('search')   search?: string,
  ) {
    return this.mastersService.findAll({ city, category, search });
  }

  @Get('cities')
  getCities() {
    return this.mastersService.findAll_cities();
  }

  // ── Authenticated profile endpoints ──────────────────────────────────────
  // IMPORTANT: these fixed-segment routes MUST appear before `:slug` so that
  // NestJS does not swallow "profile" or "slug" as a dynamic parameter.

  /** GET /masters/profile/me — returns the caller's own profile (null if none yet). */
  @UseGuards(JwtAuthGuard)
  @Get('profile/me')
  getMyProfile(@Request() req: { user: { id: string } }) {
    return this.mastersService.getMyProfile(req.user.id);
  }

  /** POST /masters/profile — create profile for the authenticated MASTER. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MASTER)
  @Post('profile')
  createProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateMasterProfileDto,
  ) {
    return this.mastersService.createProfile(req.user.id, dto);
  }

  /** POST /masters/profile/categories — set (replace) master's specialization categories. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MASTER)
  @Post('profile/categories')
  setCategories(
    @Request() req: { user: { id: string } },
    @Body() dto: SetMasterCategoriesDto,
  ) {
    return this.mastersService.setCategories(req.user.id, dto);
  }

  /** PATCH /masters/profile — update the authenticated MASTER's profile. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MASTER)
  @Patch('profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateMasterProfileDto,
  ) {
    return this.mastersService.updateProfile(req.user.id, dto);
  }

  /** GET /masters/slug/check?slug=xxx — availability check (no auth required). */
  @Get('slug/check')
  checkSlug(
    @Query('slug') slug: string,
    @Query('userId') userId?: string,
  ) {
    return this.mastersService.checkSlugAvailability(slug, userId);
  }

  // ── Public master detail — slug or legacy UUID ───────────────────────────

  /** GET /masters/:slug — resolves by slug first, falls back to user UUID. */
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.mastersService.findOne(slug);
  }

  /** GET /masters/:slug/reviews — public list of reviews for a master. */
  @Get(':slug/reviews')
  getReviews(@Param('slug') slug: string) {
    return this.mastersService.getReviewsForMaster(slug);
  }
}

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { UsersQueryDto, BookingsQueryDto, ReviewsQueryDto } from './dto/admin-query.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  getUsers(@Query() dto: UsersQueryDto) {
    return this.adminService.getUsers(dto);
  }

  @Patch('users/:id/ban')
  banUser(@Request() req: { user: { id: string } }, @Param('id') targetId: string) {
    return this.adminService.banUser(req.user.id, targetId);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') targetId: string) {
    return this.adminService.unbanUser(targetId);
  }

  // ── Bookings ───────────────────────────────────────────────────────────────

  @Get('bookings')
  getBookings(@Query() dto: BookingsQueryDto) {
    return this.adminService.getBookings(dto);
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  @Get('reviews')
  getReviews(@Query() dto: ReviewsQueryDto) {
    return this.adminService.getReviews(dto);
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }
}

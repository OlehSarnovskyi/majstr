import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role, BookingStatus } from '@prisma/client';

@SkipThrottle()
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateBookingDto
  ) {
    return this.bookingsService.create(req.user.id, dto);
  }

  @Get('my')
  findMyBookings(@Request() req: { user: { id: string; role: string } }) {
    if (req.user.role === 'MASTER') {
      return this.bookingsService.findMasterBookings(req.user.id);
    }
    return this.bookingsService.findClientBookings(req.user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto
  ) {
    return this.bookingsService.updateStatus(
      id,
      req.user.id,
      dto.status as BookingStatus
    );
  }
}

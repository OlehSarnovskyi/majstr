import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';

@SkipThrottle()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** POST /reviews — create a review for a completed booking. Requires auth. */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user.id, dto);
  }

  /** GET /reviews/booking/:bookingId — fetch review for a specific booking. */
  @Get('booking/:bookingId')
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.reviewsService.findByBooking(bookingId);
  }
}

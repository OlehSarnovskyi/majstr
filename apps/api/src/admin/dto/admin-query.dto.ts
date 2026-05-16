import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Role, BookingStatus } from '@prisma/client';

export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20;
}

export class UsersQueryDto extends PaginationDto {
  @IsOptional() @IsEnum(Role)
  role?: Role;

  @IsOptional() @IsString()
  search?: string;
}

export class BookingsQueryDto extends PaginationDto {
  @IsOptional() @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional() @Type(() => Number)
  minPrice?: number;

  @IsOptional() @Type(() => Number)
  maxPrice?: number;

  @IsOptional() @IsString()
  dateFrom?: string;

  @IsOptional() @IsString()
  dateTo?: string;

  @IsOptional() @IsUUID()
  masterId?: string;

  @IsOptional() @IsUUID()
  clientId?: string;
}

export class ReviewsQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  minRating?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  maxRating?: number;
}

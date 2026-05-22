import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { NoProfanity } from '../../common/validators/no-profanity.validator';

export class CreateReviewDto {
  @IsUUID()
  bookingId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  @NoProfanity()
  comment?: string;
}

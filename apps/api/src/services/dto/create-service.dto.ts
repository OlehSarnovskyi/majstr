import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { NoProfanity } from '../../common/validators/no-profanity.validator';

export class CreateServiceDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @MaxLength(100)
  @NoProfanity()
  name: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(10)
  @MaxLength(1000)
  @NoProfanity()
  description: string;

  @IsNumber()
  @Min(0)
  @Max(100000)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  durationMinutes?: number;

  @IsUUID()
  categoryId: string;
}

import { IsOptional, IsString, MinLength, MaxLength, Matches, IsObject, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { NoProfanity } from '../../common/validators/no-profanity.validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @MaxLength(50)
  @NoProfanity()
  firstName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @MaxLength(50)
  @NoProfanity()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  @Matches(/^\+?[\d\s\-\(\)]{9,20}$/, {
    message: 'Zadajte platné telefónne číslo (napr. +421 900 123 456)',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(1000)
  @NoProfanity()
  bio?: string;

  /** UUID of a City row — optional for all users */
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsObject()
  workingHours?: Record<string, { enabled: boolean; from: string; to: string }>;
}

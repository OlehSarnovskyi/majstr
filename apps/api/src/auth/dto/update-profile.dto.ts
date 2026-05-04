import { IsOptional, IsString, MinLength, MaxLength, Matches, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @MaxLength(50)
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
  bio?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsObject()
  workingHours?: Record<string, { enabled: boolean; from: string; to: string }>;
}

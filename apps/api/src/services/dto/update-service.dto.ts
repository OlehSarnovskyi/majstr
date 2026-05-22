import { IsString, IsNumber, Min, MinLength, IsUUID, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { NoProfanity } from '../../common/validators/no-profanity.validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @NoProfanity()
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(10)
  @NoProfanity()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

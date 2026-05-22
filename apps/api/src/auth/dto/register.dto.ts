import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { NoProfanity } from '../../common/validators/no-profanity.validator';

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @NoProfanity()
  firstName: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @NoProfanity()
  lastName: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  phone?: string;
}

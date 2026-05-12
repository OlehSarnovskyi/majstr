import { IsString, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';

export class UpdateMasterProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
    message:
      'slug may only contain lowercase letters, digits and hyphens, ' +
      'and must not start or end with a hyphen',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/** Validates that a string is a recognised IANA timezone identifier. */
function IsIanaTimezone(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIanaTimezone',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          try {
            Intl.DateTimeFormat(undefined, { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return '$property must be a valid IANA timezone (e.g. Europe/Bratislava)';
        },
      },
    });
  };
}

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

  @IsOptional()
  @IsIanaTimezone()
  timezone?: string;
}

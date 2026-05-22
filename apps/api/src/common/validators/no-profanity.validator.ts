import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { PROFANITY_LIST } from '../profanity/profanity.list';

@ValidatorConstraint({ name: 'noProfanity', async: false })
export class NoProfanityConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.trim() === '') return true;
    const lower = value.toLowerCase();
    return !PROFANITY_LIST.some(word => lower.includes(word));
  }

  defaultMessage(): string {
    return 'Text obsahuje nevhodné slová';
  }
}

/**
 * Class-validator decorator that rejects strings containing profanity.
 * Apply to any user-facing text field (name, description, bio, note, comment).
 *
 * @example
 * \@IsString()
 * \@NoProfanity()
 * name: string;
 */
export function NoProfanity(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: NoProfanityConstraint,
    });
  };
}

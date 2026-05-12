import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum BookingAction {
  CONFIRM = 'CONFIRMED',
  CANCEL = 'CANCELLED',
  COMPLETE = 'COMPLETED',
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingAction)
  status: BookingAction;

  /** Final price charged by the master — only relevant when status = COMPLETED. */
  @IsOptional()
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsNumber({}, { message: 'actualPrice must be a number' })
  @Min(0.01, { message: 'Cena musí byť väčšia ako 0' })
  @Max(50000, { message: 'Maximálna cena je 50 000 €' })
  actualPrice?: number;
}

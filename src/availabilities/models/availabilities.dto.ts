import { Type } from 'class-transformer';
import { IsDate, IsInt } from 'class-validator';

import { ICreateAvailability } from './availabilities.interface';

export class CreateAvailabilityDto implements ICreateAvailability {
  @Type(() => Date)
  @IsDate()
  slot_start: Date;

  @Type(() => Date)
  @IsDate()
  slot_end: Date;

  @IsInt()
  participantId: number;
}

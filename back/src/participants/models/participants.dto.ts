import { PickType } from '@nestjs/mapped-types';
import { IsString, MaxLength, MinLength, Length, Matches } from 'class-validator';
import { ICreateParticipant } from './participants.interface';

export class CreateParticipantDto implements ICreateParticipant {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  @Length(8, 8)
  @Matches(/^[0-9a-f]{8}$/i)
  pollId: string;
}

export class UpdateParticipantDto extends PickType(CreateParticipantDto, ['name']) {
}
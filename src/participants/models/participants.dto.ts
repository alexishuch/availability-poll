import { PickType } from '@nestjs/mapped-types';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { ICreateParticipant } from './participants.interface';

export class CreateParticipantDto implements ICreateParticipant {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsInt()
  pollId: number;
}

export class UpdateParticipantDto extends PickType(CreateParticipantDto, ['name']) {
}
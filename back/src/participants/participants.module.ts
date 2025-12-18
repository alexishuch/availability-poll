import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';
import { Participant } from './models/participant.entity';
import { Poll } from 'src/polls/models/poll.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Participant, Poll])],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
})
export class ParticipantsModule { }

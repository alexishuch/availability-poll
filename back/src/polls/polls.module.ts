import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { Poll } from './models/poll.entity';
import { Participant } from 'src/participants/models/participant.entity';
import { Availability } from 'src/availabilities/models/availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, Participant, Availability])],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule { }

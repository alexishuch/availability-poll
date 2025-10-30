import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { Poll } from './entities/poll.entity';
import { Participant } from './entities/participant.entity';
import { Availability } from './entities/availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, Participant, Availability])],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}

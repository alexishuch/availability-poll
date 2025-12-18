import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitiesService } from './availabilities.service';
import { AvailabilitiesController } from './availabilities.controller';
import { Availability } from './models/availability.entity';
import { Participant } from 'src/participants/models/participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, Participant])],
  controllers: [AvailabilitiesController],
  providers: [AvailabilitiesService],
})
export class AvailabilitiesModule { }

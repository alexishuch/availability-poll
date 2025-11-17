import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { deserializeAvailability, formatDateToPGSlotRange } from 'src/availabilities/date.tools';
import { Participant } from 'src/participants/models/participant.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateAvailabilityDto } from './models/availabilities.dto';
import { IAvailability } from './models/availabilities.interface';
import { Availability } from './models/availability.entity';

@Injectable()
export class AvailabilitiesService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) { }

  async create(createAvailabilityDto: CreateAvailabilityDto): Promise<IAvailability> {
    const participant = await this.participantRepository.findOne({ where: { id: createAvailabilityDto.participantId } });
    if (!participant) throw new NotFoundException('Participant not found');

    const availability = new Availability();
    availability.slot = formatDateToPGSlotRange(createAvailabilityDto.slot_start, createAvailabilityDto.slot_end);
    availability.participant = participant;

    try {
      const savedAvailability = await this.availabilityRepository.save(availability);
      // Slots are stored as ranges in Postgres, need to deserialize before returning
      return deserializeAvailability(savedAvailability);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23P01'
      ) {
        throw new ConflictException('Participant already has an overlapping or identical slot');
      }
      throw error;
    }
  }

  async findOne(id: number): Promise<IAvailability> {
    const availability = await this.availabilityRepository.findOne({ where: { id }, relations: ['participant'] });
    if (!availability) throw new NotFoundException('Availability not found');
    return deserializeAvailability(availability);
  }

  async remove(id: number): Promise<void> {
    const result = await this.availabilityRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Availability not found');
  }
}

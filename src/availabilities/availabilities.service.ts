import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    const participant = await this.participantRepository.findOne({ where: { id: createAvailabilityDto.participantId }, relations: ['poll'] });
    if (!participant) throw new NotFoundException('Participant not found');
    const poll = participant.poll;

    const { slot_start, slot_end } = createAvailabilityDto;
    if (slot_end <= slot_start) {
      throw new BadRequestException('slot_end must be after slot_start');
    }

    if (slot_start < poll.created_at) {
      throw new BadRequestException(`Availability slot cannot start before poll creation date (${poll.created_at.toLocaleDateString()})`);
    }

    if (poll.start_date) {
      const pollStartDate = new Date(poll.start_date); // TypeORM returns type "date" as strings
      if (slot_start < pollStartDate) {
        throw new BadRequestException(`Availability slot must start on or after poll start date (${pollStartDate.toLocaleDateString()})`);
      }
    }

    if (poll.end_date) {
      const pollEndDate = new Date(poll.end_date); // TypeORM returns type "date" as strings
      const pollEndDateEnd = new Date(pollEndDate.getFullYear(), pollEndDate.getMonth(), pollEndDate.getDate(), 23, 59, 59, 999);
      if (slot_end > pollEndDateEnd) {
        throw new BadRequestException(`Availability slot must end on or before poll end date (${pollEndDateEnd.toLocaleDateString()})`);
      }
    }

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

  async findOne(id: string): Promise<IAvailability> {
    const availability = await this.availabilityRepository.findOne({ where: { id }, relations: ['participant'] });
    if (!availability) throw new NotFoundException('Availability not found');
    return deserializeAvailability(availability);
  }

  async remove(id: string): Promise<void> {
    const availability = await this.availabilityRepository.findOne({ where: { id } });
    if (!availability) throw new NotFoundException('Availability not found');
    await this.availabilityRepository.remove(availability);
  }
}

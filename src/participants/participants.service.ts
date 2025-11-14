import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Poll } from 'src/polls/models/poll.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { Participant } from './models/participant.entity';
import { CreateParticipantDto, UpdateParticipantDto } from './models/participants.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
  ) { }

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    const participant = new Participant();
    participant.name = createParticipantDto.name;

    const poll = await this.pollRepository.findOne({ where: { id: createParticipantDto.pollId } });
    if (!poll) throw new NotFoundException('Poll not found');
    participant.poll = poll;

    try {
      return await this.participantRepository.save(participant);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Participant violates a unique constraint');
      }
      throw error;
    }
  }

  async findAll(): Promise<Participant[]> {
    return this.participantRepository.find({ relations: ['poll'] });
  }

  async findOne(id: number): Promise<Participant> {
    const participant = await this.participantRepository.findOne({ where: { id }, relations: ['poll', 'availabilities'] });
    if (!participant) throw new NotFoundException('Participant not found');
    return participant;
  }

  async update(id: number, updateParticipantDto: UpdateParticipantDto): Promise<Participant> {
    const participant = await this.participantRepository.findOne({ where: { id } });
    if (!participant) throw new NotFoundException('Participant not found');
    this.participantRepository.merge(participant, updateParticipantDto);

    try {
      await this.participantRepository.save(participant);
      return this.findOne(id);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Participant violates a unique constraint');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.participantRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Participant not found');
  }
}

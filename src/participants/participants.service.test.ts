import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantsService } from './participants.service';
import { Participant } from './models/participant.entity';
import { Poll } from 'src/polls/models/poll.entity';
import { CreateParticipantDto, UpdateParticipantDto } from './models/participants.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { repositoryMock } from 'src/fixtures/repository.fixture';

const createdAtDate = new Date('2025-01-01T00:00:00Z');

describe('ParticipantsService', () => {
  let service: ParticipantsService;
  let participantRepository: Repository<Participant>;
  let pollRepository: Repository<Poll>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        {
          provide: getRepositoryToken(Participant),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(Poll),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<ParticipantsService>(ParticipantsService);
    participantRepository = module.get<Repository<Participant>>(getRepositoryToken(Participant));
    pollRepository = module.get<Repository<Poll>>(getRepositoryToken(Poll));
  });

  describe('create', () => {
    it('should create a participant with valid pollId', async () => {
      const createDto: CreateParticipantDto = { name: 'John Doe', pollId: 1 };
      const poll: Poll = { id: 1, name: 'Test Poll', participants: [], created_at: createdAtDate };
      const participant: Participant = { id: 1, name: 'John Doe', poll, availabilities: [] };
      jest.spyOn(pollRepository, 'findOne').mockResolvedValue(poll);
      jest.spyOn(participantRepository, 'save').mockResolvedValue(participant);

      const result = await service.create(createDto);

      expect(result).toEqual(participant);
      expect(pollRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if poll not found', async () => {
      const createDto: CreateParticipantDto = { name: 'John Doe', pollId: 1 };
      jest.spyOn(pollRepository, 'findOne').mockResolvedValue(null);

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      const createDto: CreateParticipantDto = { name: 'John Doe', pollId: 1 };
      const poll: Poll = { id: 1, name: 'Test Poll', participants: [], created_at: createdAtDate };
      const error = new QueryFailedError('query', [], { code: '23505' } as any);
      jest.spyOn(pollRepository, 'findOne').mockResolvedValue(poll);
      jest.spyOn(participantRepository, 'save').mockRejectedValue(error);

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all participants', async () => {
      const participants: Participant[] = [{ id: 1, name: 'John', poll: {} as Poll, availabilities: [] }];
      jest.spyOn(participantRepository, 'find').mockResolvedValue(participants);

      const result = await service.findAll();

      expect(result).toEqual(participants);
      expect(participantRepository.find).toHaveBeenCalledWith({ relations: ['poll'] });
    });
  });

  describe('findOne', () => {
    it('should return a participant if found', async () => {
      const participant: Participant = { id: 1, name: 'John', poll: {} as Poll, availabilities: [] };
      jest.spyOn(participantRepository, 'findOne').mockResolvedValue(participant);

      const result = await service.findOne(1);

      expect(result).toEqual(participant);
      expect(participantRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['poll', 'availabilities'] });
    });

    it('should throw NotFoundException if participant not found', async () => {
      jest.spyOn(participantRepository, 'findOne').mockResolvedValue(null);

      const result = service.findOne(1);

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a participant', async () => {
      const updateDto: UpdateParticipantDto = { name: 'Jane Doe' };
      const participant: Participant = { id: 1, name: 'John Doe', poll: {} as Poll, availabilities: [] };
      const updatedParticipant: Participant = { id: 1, name: 'Jane Doe', poll: {} as Poll, availabilities: [] };
      jest.spyOn(participantRepository, 'findOne').mockResolvedValue(participant);
      jest.spyOn(participantRepository, 'save').mockResolvedValue(updatedParticipant);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedParticipant);
      expect(participantRepository.merge).toHaveBeenCalledWith(participant, updateDto);
    });

    it('should throw NotFoundException if participant not found', async () => {
      const updateDto: UpdateParticipantDto = { name: 'Jane Doe' };
      jest.spyOn(participantRepository, 'findOne').mockResolvedValue(null);

      const result = service.update(1, updateDto);

      await expect(result).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      const updateDto: UpdateParticipantDto = { name: 'Jane Doe' };
      const participant: Participant = { id: 1, name: 'John Doe', poll: {} as Poll, availabilities: [] };
      const error = new QueryFailedError('query', [], { code: '23505' } as any);
      jest.spyOn(participantRepository, 'findOne').mockResolvedValue(participant);
      jest.spyOn(participantRepository, 'save').mockRejectedValue(error);

      const result = service.update(1, updateDto);

      await expect(result).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a participant', async () => {
      jest.spyOn(participantRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] });

      const result = service.remove(1);

      await expect(result).resolves.toBeUndefined();
      expect(participantRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if participant not found', async () => {
      jest.spyOn(participantRepository, 'delete').mockResolvedValue({ affected: 0, raw: [] });

      const result = service.remove(1);

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PollsService } from './polls.service';
import { Poll } from './models/poll.entity';
import { CreatePollDto, UpdatePollDto } from './models/polls.dto';
import { NotFoundException } from '@nestjs/common';
import { ICommonSlot } from './models/polls.interface';
import { repositoryMock } from 'src/fixtures/repository.fixture';

const createdAtDate = new Date('2025-01-01T00:00:00Z');
const commonSlots: ICommonSlot[] = [
  { start_date: new Date('2025-01-01T10:00:00'), end_date: new Date('2025-01-01T12:00:00'), count: 2, participants_names: ['John', 'Jane'] },
];

describe('PollsService', () => {
  let service: PollsService;
  let pollRepository: Repository<Poll>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        {
          provide: getRepositoryToken(Poll),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
    pollRepository = module.get<Repository<Poll>>(getRepositoryToken(Poll));
  });

  describe('create', () => {
    it('should create a poll', async () => {
      const createDto: CreatePollDto = { name: 'New Poll' };
      const poll: Poll = { id: 1, ...createDto, participants: [], created_at: createdAtDate };
      jest.spyOn(pollRepository, 'save').mockResolvedValue(poll);

      const result = await service.create(createDto);

      expect(result).toEqual(poll);
      expect(pollRepository.save).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all polls', async () => {
      const polls: Poll[] = [
        { id: 1, name: 'Poll 1', participants: [], created_at: createdAtDate },
        { id: 2, name: 'Poll 2', participants: [], created_at: createdAtDate },
      ];
      jest.spyOn(pollRepository, 'find').mockResolvedValue(polls);

      const result = await service.findAll();

      expect(result).toEqual(polls);
      expect(pollRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no polls exist', async () => {
      jest.spyOn(pollRepository, 'find').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOneComputed', () => {
    it('should return enriched poll with common slots', async () => {
      const poll: Poll = { id: 1, name: 'Test Poll', participants: [], created_at: createdAtDate };
      jest.spyOn(pollRepository, 'findOne').mockResolvedValue(poll);
      jest.spyOn(pollRepository, 'query').mockResolvedValue(commonSlots);

      const result = await service.findOneComputed(1);

      expect(result).toEqual({ ...poll, commonSlots });
      expect(pollRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { participants: true },
      });
    });

    it('should return null if poll not found', async () => {
      jest.spyOn(pollRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOneComputed(1);

      expect(result).toBeNull();
      expect(pollRepository.query).not.toHaveBeenCalled();
    });
  });

  describe('findCommonSlots', () => {
    it('should return common slots for a poll', async () => {
      jest.spyOn(pollRepository, 'query').mockResolvedValue(commonSlots);

      const result = await service.findCommonSlots(1);

      expect(result).toEqual(commonSlots);
      expect(pollRepository.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it('should return empty array when no common slots exist', async () => {
      jest.spyOn(pollRepository, 'query').mockResolvedValue([]);

      const result = await service.findCommonSlots(1);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a poll', async () => {
      const updateDto: UpdatePollDto = { name: 'Updated Poll' };
      const poll: Poll = { id: 1, name: 'Old Poll', participants: [], created_at: createdAtDate };
      const updatedPoll: Poll = { id: 1, name: 'Updated Poll', participants: [], created_at: createdAtDate };
      jest.spyOn(pollRepository, 'findOne').mockResolvedValue(poll);
      jest.spyOn(pollRepository, 'save').mockResolvedValue(updatedPoll);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedPoll);
      expect(pollRepository.merge).toHaveBeenCalledWith(poll, updateDto);
      expect(pollRepository.save).toHaveBeenCalledWith(poll);
    });

    it('should throw NotFoundException if poll not found', async () => {
      const updateDto: UpdatePollDto = { name: 'Updated Poll' };
      jest.spyOn(pollRepository, 'findOne').mockResolvedValue(null);

      const result = service.update(1, updateDto);

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a poll', async () => {
      jest.spyOn(pollRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] });

      const result = service.remove(1);

      await expect(result).resolves.toBeUndefined();
      expect(pollRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if poll not found', async () => {
      jest.spyOn(pollRepository, 'delete').mockResolvedValue({ affected: 0, raw: [] });

      const result = service.remove(1);

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });
});

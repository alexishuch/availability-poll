import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Availability } from 'src/availabilities/models/availability.entity';
import { Participant } from 'src/participants/models/participant.entity';
import { clearTestData, createTestDataSource } from 'test/test-db.helper';
import { DataSource, Repository } from 'typeorm';
import { Poll } from './models/poll.entity';
import { CreatePollDto, UpdatePollDto } from './models/polls.dto';
import { PollsService } from './polls.service';

describe('PollsService', () => {
  let service: PollsService;
  let pollRepository: Repository<Poll>;
  let participantRepository: Repository<Participant>;
  let availabilityRepository: Repository<Availability>;
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        {
          provide: getRepositoryToken(Poll),
          useValue: dataSource.getRepository(Poll),
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: dataSource.getRepository(Participant),
        },
        {
          provide: getRepositoryToken(Availability),
          useValue: dataSource.getRepository(Availability),
        },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
    pollRepository = module.get<Repository<Poll>>(getRepositoryToken(Poll));
    participantRepository = module.get<Repository<Participant>>(getRepositoryToken(Participant));
    availabilityRepository = module.get<Repository<Availability>>(getRepositoryToken(Availability));
  });

  afterEach(async () => {
    await clearTestData(dataSource);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('create', () => {
    it('should create a poll', async () => {
      const createDto: CreatePollDto = { name: 'Pierre Poll Jacques', start_date: new Date('2025-01-02'), end_date: new Date('2025-01-12') };

      const result = await service.create(createDto);

      const stored = await pollRepository.findOne({ where: { id: result.id } });
      expect(result.id).toBeDefined();
      expect(stored).toMatchObject({
        ...createDto,
        created_at: expect.any(Date)
      });
    });

    it('should throw BadRequestException if end_date is before start_date', async () => {
      const createDto: CreatePollDto = { name: 'Bad Poll', start_date: new Date('2025-01-02'), end_date: new Date('2025-01-01') };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Poll end date must be after start date');
    });

    it('should throw BadRequestException if start_date is in the past', async () => {
      const createDto: CreatePollDto = { name: 'Past Poll', start_date: new Date('2020-01-01') };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Poll start date cannot be in the past');
    });
  });

  describe('findAll', () => {
    it('should return all polls', async () => {
      await pollRepository.save([
        { name: 'Poll 1' },
        { name: 'Poll 2' },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result?.map((poll) => poll.name)).toEqual(expect.arrayContaining(['Poll 1', 'Poll 2']));
    });

    it('should return empty array when no polls exist', async () => {
      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOneComputed', () => {
    it('should return enriched poll with common slots', async () => {
      const poll = await pollRepository.save({ name: 'Pierre Poll Jacques' });
      const john = await participantRepository.save({ name: 'John', poll });
      const jane = await participantRepository.save({ name: 'Jane', poll });
      await availabilityRepository.save([
        {
          participant: john,
          slot: '{["2025-01-01 10:00:00+00", "2025-01-01 12:00:00+00")}'
        },
        {
          participant: jane,
          slot: '{["2025-01-01 11:00:00+00", "2025-01-01 13:00:00+00")}'
        },
      ]);

      const result = await service.findOneComputed(poll.id);

      expect(result.participants).toHaveLength(2);
      expect(result.participants.map((participant) => participant.name)).toEqual(
        expect.arrayContaining(['John', 'Jane']),
      );
      expect(result.commonSlots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            count: 2,
            participants_names: ['Jane', 'John'],
          }),
        ]),
      );
    });

    it('should throw NotFoundException if poll not found', async () => {
      const result = service.findOneComputed('abcd1234');

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCommonSlots', () => {
    it('should return common slots for a poll', async () => {
      const poll = await pollRepository.save({ name: 'Overlap Poll' });
      const john = await participantRepository.save({ name: 'John', poll });
      const jane = await participantRepository.save({ name: 'Jane', poll });
      await availabilityRepository.save([
        {
          participant: john,
          slot: '{["2025-01-01 09:00:00+00", "2025-01-01 11:30:00+00"]}',
        },
        {
          participant: john,
          slot: '{["2025-01-01 13:00:00+00", "2025-01-01 15:00:00+00"]}',
        },
        {
          participant: jane,
          slot: '{["2025-01-01 10:00:00+00", "2025-01-01 12:00:00+00"]}',
        },
        {
          participant: jane,
          slot: '{["2025-01-01 14:00:00+00", "2025-01-01 16:00:00+00"]}',
        },
      ]);

      const result = await service.findCommonSlots(poll.id);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            start_date: new Date('2025-01-01T10:00:00.000Z'),
            end_date: new Date('2025-01-01T11:30:00.000Z'),
            count: 2,
            participants_names: ['Jane', 'John'],
          }),
          expect.objectContaining({
            start_date: new Date('2025-01-01T14:00:00.000Z'),
            end_date: new Date('2025-01-01T15:00:00.000Z'),
            count: 2,
            participants_names: ['Jane', 'John'],
          }),
        ]),
      );
    });

    it('should return empty array when no common slots exist', async () => {
      const poll = await pollRepository.save({ name: 'Lonely Poll' });
      const john = await participantRepository.save({ name: 'John', poll });
      await availabilityRepository.save({
        participant: john,
        slot: '{["2025-01-02 09:00:00+00", "2025-01-02 10:00:00+00")}'
      });

      const result = await service.findCommonSlots(poll.id);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a poll', async () => {
      const updateDto: UpdatePollDto = { name: 'Updated Poll' };
      const poll = await pollRepository.save({ name: 'Old Poll' });

      const result = await service.update(poll.id, updateDto);

      const stored = await pollRepository.findOne({ where: { id: poll.id } });
      expect(result.name).toBe('Updated Poll');
      expect(stored?.name).toBe('Updated Poll');
    });

    it('should throw NotFoundException if poll not found', async () => {
      const updateDto: UpdatePollDto = { name: 'Updated Poll' };

      await expect(service.update('efgh5678', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a poll', async () => {
      const poll = await pollRepository.save({ name: 'Poll to remove' });

      await expect(service.remove(poll.id)).resolves.toBeUndefined();

      const stored = await pollRepository.findOne({ where: { id: poll.id } });
      expect(stored).toBeNull();
    });

    it('should throw NotFoundException if poll not found', async () => {
      const result = service.remove('efgh5678');

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });
});

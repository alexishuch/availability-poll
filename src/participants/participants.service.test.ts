import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Poll } from 'src/polls/models/poll.entity';
import { nonExistentParticipantId, testParticipantData, testPollData } from 'src/testing/test-data.fixture';
import { clearTestData, createTestDataSource } from 'src/testing/test-db.helper';
import { DataSource, Repository } from 'typeorm';
import { Participant } from './models/participant.entity';
import { CreateParticipantDto, UpdateParticipantDto } from './models/participants.dto';
import { ParticipantsService } from './participants.service';

describe('ParticipantsService', () => {
  let service: ParticipantsService;
  let participantRepository: Repository<Participant>;
  let pollRepository: Repository<Poll>;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        {
          provide: getRepositoryToken(Participant),
          useValue: dataSource.getRepository(Participant),
        },
        {
          provide: getRepositoryToken(Poll),
          useValue: dataSource.getRepository(Poll),
        },
      ],
    }).compile();

    service = module.get<ParticipantsService>(ParticipantsService);
    participantRepository = module.get<Repository<Participant>>(getRepositoryToken(Participant));
    pollRepository = module.get<Repository<Poll>>(getRepositoryToken(Poll));
  });

  afterEach(async () => {
    await clearTestData(dataSource);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('create', () => {
    it('should create a participant with valid pollId and return it', async () => {
      const poll = await pollRepository.save(testPollData);
      const createDto: CreateParticipantDto = { name: 'John Doe', pollId: poll.id };

      const result = await service.create(createDto);
      const stored = await participantRepository.findOne({ where: { id: result.id }, relations: ['poll'] });

      expect(result).toEqual({
        name: 'John Doe',
        poll,
        id: expect.any(String)
      });
      expect(stored).toEqual({
        name: 'John Doe',
        poll,
        id: expect.any(String)
      });
    });

    it('should throw NotFoundException if poll not found', async () => {
      const createDto: CreateParticipantDto = { name: 'John Doe', pollId: 'efgh5678' };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      const poll = await pollRepository.save(testPollData);
      await participantRepository.save({ ...testParticipantData, poll });
      const createDto: CreateParticipantDto = { name: testParticipantData.name, pollId: poll.id };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all participants', async () => {
      const poll = await pollRepository.save(testPollData);
      await participantRepository.save([
        { name: 'John', poll },
        { name: 'Jane', poll },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.name)).toEqual(expect.arrayContaining(['John', 'Jane']));
    });
  });

  describe('findOne', () => {
    it('should return a participant if found', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ name: 'John', poll });

      const result = await service.findOne(participant.id);

      expect(result).toEqual({
        id: participant.id,
        name: 'John',
        poll: expect.objectContaining(poll),
        availabilities: [],
      });
    });

    it('should throw NotFoundException if participant not found', async () => {
      const result = service.findOne(nonExistentParticipantId);

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a participant', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ name: 'John Doe', poll });
      const updateDto: UpdateParticipantDto = { name: 'Jane Doe' };

      const result = await service.update(participant.id, updateDto);

      expect(result.name).toBe('Jane Doe');
      const stored = await participantRepository.findOne({ where: { id: participant.id } });
      expect(stored?.name).toBe('Jane Doe');
    });

    it('should throw NotFoundException if participant not found', async () => {
      const updateDto: UpdateParticipantDto = { name: 'Jane Doe' };

      const result = service.update(nonExistentParticipantId, updateDto);

      await expect(result).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      const poll = await pollRepository.save(testPollData);
      await participantRepository.save({ name: 'Jane Doe', poll });
      const participant = await participantRepository.save({ name: 'John Doe', poll });
      const updateDto: UpdateParticipantDto = { name: 'Jane Doe' };

      const result = service.update(participant.id, updateDto);

      await expect(result).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a participant', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ name: 'John', poll });

      await service.remove(participant.id);
      const stored = await participantRepository.findOne({ where: { id: participant.id } });

      expect(stored).toBeNull();
    });

    it('should throw NotFoundException if participant not found', async () => {
      const result = service.remove(nonExistentParticipantId);

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });
});

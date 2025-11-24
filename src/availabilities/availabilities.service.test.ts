import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Participant } from 'src/participants/models/participant.entity';
import { Poll } from 'src/polls/models/poll.entity';
import { clearTestData, createTestDataSource } from 'src/testing/test-helpers';
import { DataSource, Repository } from 'typeorm';
import { AvailabilitiesService } from './availabilities.service';
import { Availability } from './models/availability.entity';

const slotStartTimestamp = new Date('2024-01-01T10:00:00Z');
const slotEndTimestamp = new Date('2024-01-01T11:00:00Z');
const formattedSlot = '{["2024-01-01T10:00:00.000Z","2024-01-01T11:00:00.000Z")}';
const formattedSlotFromDB = '{["2024-01-01 10:00:00","2024-01-01 11:00:00")}';
const testPollData = { name: 'Test Poll' };
const testParticipantData = { name: 'Guy' };

describe('AvailabilitiesService', () => {
  let service: AvailabilitiesService;
  let availabilityRepository: Repository<Availability>;
  let participantRepository: Repository<Participant>;
  let pollRepository: Repository<Poll>;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilitiesService,
        {
          provide: getRepositoryToken(Availability),
          useValue: dataSource.getRepository(Availability),
        },
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

    service = module.get<AvailabilitiesService>(AvailabilitiesService);
    availabilityRepository = module.get<Repository<Availability>>(getRepositoryToken(Availability));
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
    it('should create an availability', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ ...testParticipantData, poll });
      const createDto = {
        participantId: participant.id,
        slot_start: slotStartTimestamp,
        slot_end: slotEndTimestamp,
      };

      const result = await service.create(createDto);

      const stored = await availabilityRepository.findOne({ where: { id: result.id }, relations: ['participant'] });
      expect(result).toEqual({ ...createDto, id: expect.any(Number) });
      expect(stored).toEqual({
        id: expect.any(Number),
        participant: expect.objectContaining({ id: participant.id }),
        slot: formattedSlotFromDB,
      });
    });

    it('should throw NotFoundException if participant not found', async () => {
      const createDto = {
        participantId: 999,
        slot_start: slotStartTimestamp,
        slot_end: slotEndTimestamp,
      };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Participant not found');
    });

    it('should throw ConflictException on overlapping slot', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ ...testParticipantData, poll });
      await availabilityRepository.save({
        participant,
        slot: formattedSlot,
      });
      const createDto = {
        participantId: participant.id,
        slot_start: new Date('2024-01-01T10:30:00Z'),
        slot_end: new Date('2024-01-01T11:30:00Z'),
      };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Participant already has an overlapping or identical slot');
    });
  });

  describe('findOne', () => {
    it('should find an availability by id', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ ...testParticipantData, poll });
      const availability = await availabilityRepository.save({
        participant,
        slot: formattedSlot,
      });

      const result = await service.findOne(availability.id);

      expect(result).toEqual({
        id: availability.id,
        slot_start: slotStartTimestamp,
        slot_end: slotEndTimestamp,
        participantId: participant.id,
      });
    });

    it('should throw NotFoundException if availability not found', async () => {
      const result = service.findOne(999);

      await expect(result).rejects.toThrow('Availability not found');
    });
  });

  describe('remove', () => {
    it('should remove an availability', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ ...testParticipantData, poll });
      const availability = await availabilityRepository.save({
        participant,
        slot: formattedSlot,
      });

      await service.remove(availability.id);

      const stored = await availabilityRepository.findOne({ where: { id: availability.id } });
      expect(stored).toBeNull();
    });

    it('should throw NotFoundException if availability cannot be removed', async () => {
      const result = service.remove(999);

      await expect(result).rejects.toThrow('Availability not found');
    });
  });
});
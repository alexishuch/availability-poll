import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Participant } from 'src/participants/models/participant.entity';
import { Poll } from 'src/polls/models/poll.entity';
import { formattedSlot, formattedSlotFromDB, localePollEndDate, localePollStartDate, nonExistentAvailabilityId, nonExistentParticipantId, slotEndTimestamp, slotStartTimestamp, testParticipantData, testPollData, testPollWithDatesData } from 'src/testing/test-data.fixture';
import { clearTestData, createTestDataSource } from 'src/testing/test-db.helper';
import { DataSource, Repository } from 'typeorm';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './models/availabilities.dto';
import { Availability } from './models/availability.entity';

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
      const createDto: CreateAvailabilityDto = {
        participantId: participant.id,
        slot_start: slotStartTimestamp,
        slot_end: slotEndTimestamp,
      };

      const result = await service.create(createDto);

      const stored = await availabilityRepository.findOne({ where: { id: result.id }, relations: ['participant'] });
      expect(result).toEqual({ ...createDto, id: expect.any(String) });
      expect(stored).toEqual({
        id: expect.any(String),
        participant: expect.objectContaining({ id: participant.id }),
        slot: formattedSlotFromDB,
      });
    });

    it('should throw NotFoundException if participant not found', async () => {
      const createDto: CreateAvailabilityDto = {
        participantId: nonExistentParticipantId,
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
      const createDto: CreateAvailabilityDto = {
        participantId: participant.id,
        slot_start: new Date('2025-01-02T10:30:00Z'),
        slot_end: new Date('2025-01-02T11:30:00Z'),
      };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Participant already has an overlapping or identical slot');
    });

    it('should throw BadRequestException if slot_end is not after slot_start', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ ...testParticipantData, poll });
      const createDto: CreateAvailabilityDto = {
        participantId: participant.id,
        slot_start: slotEndTimestamp,
        slot_end: slotStartTimestamp,
      };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Availability slot end date must be after start date');
    });

    it('should throw BadRequestException if slot_start is before poll created_at', async () => {
      const poll = await pollRepository.save(testPollData);
      const participant = await participantRepository.save({ ...testParticipantData, poll });
      const createDto: CreateAvailabilityDto = {
        participantId: participant.id,
        slot_start: new Date('2020-01-01T10:00:00Z'),
        slot_end: new Date('2020-01-01T11:00:00Z'),
      };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Availability slot cannot start before poll creation date');
    });

    it('should throw BadRequestException if slot_start is before poll start_date', async () => {
      const poll = await pollRepository.save(testPollWithDatesData);
      const participant = await participantRepository.save({ ...testParticipantData, poll });
      const createDto: CreateAvailabilityDto = {
        participantId: participant.id,
        slot_start: new Date('2025-01-01T10:00:00Z'),
        slot_end: new Date('2025-01-01T11:00:00Z'),
      };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(`Availability slot must start on or after poll start date (${localePollStartDate})`);
    });

    it('should throw BadRequestException if slot_end is after poll end_date', async () => {
      const poll = await pollRepository.save(testPollWithDatesData);
      const participant = await participantRepository.save({ ...testParticipantData, poll });
      const createDto: CreateAvailabilityDto = {
        participantId: participant.id,
        slot_start: new Date('2025-01-13T10:00:00Z'),
        slot_end: new Date('2025-01-14T10:00:00Z'),
      };

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(`Availability slot must end on or before poll end date (${localePollEndDate})`);
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
      const result = service.findOne(nonExistentAvailabilityId);

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
      const result = service.remove(nonExistentAvailabilityId);

      await expect(result).rejects.toThrow('Availability not found');
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitiesService } from './availabilities.service';
import { Participant } from 'src/participants/models/participant.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { Availability } from './models/availability.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMock } from 'src/fixtures/repository.fixture';

const slotStartTimestamp = new Date('2024-01-01T10:00:00Z');
const slotEndTimestamp = new Date('2024-01-01T11:00:00Z');

describe('AvailabilitiesService', () => {
  let service: AvailabilitiesService;
  let availabilityRepository: Repository<Availability>;
  let participantRepository: Repository<Participant>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilitiesService,
        {
          provide: getRepositoryToken(Availability),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<AvailabilitiesService>(AvailabilitiesService);
    availabilityRepository = module.get<Repository<Availability>>(getRepositoryToken(Availability));
    participantRepository = module.get<Repository<Participant>>(getRepositoryToken(Participant));
  });

  describe('create', () => {
    it('should create an availability', async () => {
      const createDto = {
        participantId: 1,
        slot_start: slotStartTimestamp,
        slot_end: slotEndTimestamp,
      };
      const mockParticipant = { id: 1, name: 'Guy' } as Participant;
      const mockSavedAvailabilityEntity = { id: 1, slot: '{["2024-01-01T10:00:00.000Z","2024-01-01T11:00:00.000Z")}', participant: mockParticipant } as Availability;
      jest.spyOn(participantRepository, 'findOne').mockResolvedValue(mockParticipant);
      jest.spyOn(availabilityRepository, 'save').mockResolvedValue(mockSavedAvailabilityEntity);

      const result = await service.create(createDto);

      expect(participantRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(availabilityRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ ...createDto, id: 1 });
    });

    it('should throw NotFoundException if participant not found', async () => {
      const createDto = {
        participantId: 999,
        slot_start: slotStartTimestamp,
        slot_end: slotEndTimestamp,
      };
      jest.spyOn(participantRepository, 'findOne').mockResolvedValue(null);

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Participant not found');
    });

    it('should throw ConflictException on overlapping slots', async () => {
      const createDto = {
        participantId: 1,
        slot_start: slotStartTimestamp,
        slot_end: slotEndTimestamp,
      };
      const mockParticipant = { id: 1, name: 'Guy' } as Participant;
      const error = new QueryFailedError('query', [], { code: '23P01' } as any);

      jest.spyOn(participantRepository, 'findOne').mockResolvedValue(mockParticipant);
      (availabilityRepository.save as jest.Mock).mockRejectedValue(error);

      const result = service.create(createDto);

      await expect(result).rejects.toThrow('Participant already has an overlapping or identical slot');
    });
  });

  describe('findOne', () => {
    it('should find an availability by id', async () => {
      const mockAvailability = {
        id: 1,
        slot: '{["2024-01-01 10:00:00","2024-01-01 11:00:00")}',
        participant: { id: 1, name: 'Guy' }
      } as Availability;
      const formattedAvailability = {
        id: 1,
        slot_start: slotStartTimestamp,
        slot_end: slotEndTimestamp,
        participantId: 1,
      };

      jest.spyOn(availabilityRepository, 'findOne').mockResolvedValue(mockAvailability);

      const result = await service.findOne(1);

      expect(availabilityRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['participant'] });
      expect(result).toEqual(formattedAvailability);
    });

    it('should throw NotFoundException if availability not found', async () => {
      jest.spyOn(availabilityRepository, 'findOne').mockResolvedValue(null);

      const result = service.findOne(999);

      await expect(result).rejects.toThrow('Availability not found');
    });
  });

  describe('remove', () => {
    it('should remove an availability', async () => {
      jest.spyOn(availabilityRepository, 'delete').mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.remove(1);

      expect(availabilityRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if availability cannot be removed', async () => {
      jest.spyOn(availabilityRepository, 'delete').mockResolvedValue({ affected: 0, raw: {} } as any);

      const result = service.remove(999);

      await expect(result).rejects.toThrow('Availability not found');
    });
  });
});
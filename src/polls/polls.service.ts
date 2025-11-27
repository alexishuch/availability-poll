import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from './models/poll.entity';
import { CreatePollDto, UpdatePollDto } from './models/polls.dto';
import { ICommonSlot, IPoll, IPollEnriched } from './models/polls.interface';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
  ) { }

  async create(createPollDto: CreatePollDto): Promise<IPoll> {
    if (createPollDto.start_date) {
      const todayDateString = new Date().toISOString().split('T')[0];
      const startDateString = createPollDto.start_date.toISOString().split('T')[0];
      if (startDateString < todayDateString) {
        throw new BadRequestException('Poll start date cannot be in the past');
      }
      if (createPollDto.end_date && createPollDto.end_date < createPollDto.start_date) {
        throw new BadRequestException('Poll end date must be after start date');
      }
    }

    return this.pollRepository.save(createPollDto);
  }

  async findAll(): Promise<IPoll[] | null> {
    return this.pollRepository.find();
  }

  async findOneComputed(id: string): Promise<IPollEnriched> {
    const poll = await this.pollRepository.findOne({
      where: { id },
      relations: { participants: true },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    const commonSlots = await this.findCommonSlots(id);
    return {
      ...poll,
      commonSlots,
    };
  }

  async findCommonSlots(pollId: string): Promise<ICommonSlot[]> {
    // 1. Get all availability slots for participants in the poll
    // 2. Create boundary points from all slots
    // 3. Filter the last boundary if it has no upper bound
    // 4. Create segments between each pair of boundary points
    // 5. For each segment, join with participant ranges to see which participants have availability overlapping with the segment. Keep only segments with 2+ participants.
    // 6. Display the segments with start_date, end_date, count of participants, and list of participant names

    const sql = `
  WITH participant_ranges AS (
  SELECT p.id AS participant_id, p.name AS participant_name, slot
  FROM "Availabilities" a
  JOIN "Participants" p ON a.participant_id = p.id
  WHERE p.poll_id = $1
),
bounds AS (
  SELECT lower(slot) AS b FROM participant_ranges
  UNION
  SELECT upper(slot) AS b FROM participant_ranges
),
ordered_bounds AS (
  SELECT b, lead(b) OVER (ORDER BY b) AS next_b
  FROM bounds
),
ordered_bounds_filtered AS (
  SELECT b, next_b
  FROM ordered_bounds
  WHERE next_b IS NOT NULL
),
segments AS (
  SELECT tsrange(b, next_b) AS seg
  FROM ordered_bounds_filtered
),
segment_participants AS (
  SELECT 
    seg,
    ARRAY_AGG(DISTINCT pr.participant_name ORDER BY pr.participant_name) AS participants_names,
    COUNT(DISTINCT pr.participant_id) AS count
  FROM segments s
  LEFT JOIN participant_ranges pr ON pr.slot && s.seg
  GROUP BY seg
  HAVING COUNT(DISTINCT pr.participant_id) >= 2
)
SELECT
  MIN(lower(seg)) AS start_date,
  MAX(upper(seg)) AS end_date,
  MAX(count) AS count,
  participants_names
FROM segment_participants
GROUP BY seg, participants_names
ORDER BY count DESC, start_date;
`;
    return this.pollRepository.query(sql, [pollId]);
  }

  async update(id: string, updatePollDto: UpdatePollDto): Promise<IPoll> {
    const poll = await this.pollRepository.findOne({ where: { id } });
    if (!poll) throw new NotFoundException('Poll not found');
    this.pollRepository.merge(poll, updatePollDto);
    return this.pollRepository.save(poll);
  }

  async remove(id: string): Promise<void> {
    const poll = await this.pollRepository.findOne({ where: { id } });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.pollRepository.remove(poll);
  }
}

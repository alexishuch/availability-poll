import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(createPollDto: CreatePollDto): Promise<IPoll> {
    return this.pollRepository.save(createPollDto);
  }

  async findAll(): Promise<IPoll[] | null> {
    return this.pollRepository.find();
  }

  async findOneEnriched(id: number): Promise<IPollEnriched | null> {
    const poll = await this.pollRepository.findOne({
      where: { id },
      relations: { participants: true }
    });
    if (!poll) {
      return null;
    }
    const commonSlots = await this.findCommonSlots(id);
    return {
      ...poll,
      commonSlots,
    };
  }

  async findCommonSlots(pollId: number): Promise<ICommonSlot[]> {
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
),
segments_with_flags AS (
  SELECT 
    seg,
    participants_names,
    count,
    LAG(upper(seg)) OVER (ORDER BY lower(seg)) AS prev_upper
  FROM segment_participants
),
segments_grouped AS (
  SELECT 
    seg,
    participants_names,
    count,
    SUM(CASE WHEN prev_upper = lower(seg) THEN 0 ELSE 1 END) OVER (ORDER BY lower(seg)) AS grp
  FROM segments_with_flags
)
SELECT
  MIN(lower(seg)) AS start_date,
  MAX(upper(seg)) AS end_date,
  MAX(count) AS count,
  participants_names
FROM segments_grouped
GROUP BY grp, participants_names
ORDER BY start_date;
`;
    return this.pollRepository.query(sql, [pollId]);
  }

  async update(id: number, updatePollDto: UpdatePollDto): Promise<IPoll> {
    const poll = await this.pollRepository.findOne({ where: { id } });
    if (!poll) throw new NotFoundException('Poll not found');
    this.pollRepository.merge(poll, updatePollDto);
    return this.pollRepository.save(poll);
  }

  async remove(id: number): Promise<void> {
    const result = await this.pollRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Poll not found');
  }
}

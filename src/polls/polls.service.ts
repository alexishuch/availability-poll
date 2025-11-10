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
segments AS (
  SELECT tsrange(b, next_b) AS seg
  FROM ordered_bounds
  WHERE next_b IS NOT NULL
)
SELECT 
  lower(seg) AS start_date,
  upper(seg) AS end_date,
  COUNT(DISTINCT pr.participant_id) AS count,
  ARRAY_AGG(DISTINCT pr.participant_name) AS participants_names
FROM segments
JOIN participant_ranges pr ON pr.slot && seg
GROUP BY seg
HAVING COUNT(DISTINCT pr.participant_id) > 1
ORDER BY count DESC, start_date;
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

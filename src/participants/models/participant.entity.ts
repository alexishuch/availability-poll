import { Availability } from 'src/availabilities/models/availability.entity';
import { Poll } from 'src/polls/models/poll.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('Participants')
// There is an index on (poll_id, LOWER(name)) to enforce case-insensitive uniqueness of participant names within a poll
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @ManyToOne(() => Poll, (poll: Poll) => poll.participants)
  @JoinColumn({ name: 'poll_id' })
  poll: Poll;

  @OneToMany(() => Availability, (availability: Availability) => availability.participant)
  availabilities: Availability[];
}

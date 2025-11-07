import { Availability } from 'src/availabilities/models/availability.entity';
import { Poll } from 'src/polls/models/poll.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('Participants')
@Unique(['poll', 'name'])
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

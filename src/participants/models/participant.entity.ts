import { Availability } from 'src/availabilities/models/availability.entity';
import { Poll } from 'src/polls/models/poll.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Unique, JoinColumn } from 'typeorm';

@Entity('Participants')
@Unique(['poll', 'name'])
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @ManyToOne(() => Poll, (poll: Poll) => poll.participants, { nullable: true })
  @JoinColumn({ name: 'poll_id' })
  poll: Poll;

  @OneToMany(() => Availability, (availability: Availability) => availability.participant)
  availabilities: Availability[];
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Unique, JoinColumn } from 'typeorm';
import { Poll } from './poll.entity';
import { Availability } from './availability.entity';

@Entity('Participants')
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

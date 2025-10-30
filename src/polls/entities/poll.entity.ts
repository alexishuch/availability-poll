import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Participant } from './participant.entity';

@Entity('Polls')
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'now()' })
  createdAt: Date;

  @OneToMany(() => Participant, (participant: Participant) => participant.poll)
  participants: Participant[];
}

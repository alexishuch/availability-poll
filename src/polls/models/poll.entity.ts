import { Participant } from 'src/participants/models/participant.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';

@Entity('Polls')
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'now()' })
  created_at: Date;

  @OneToMany(() => Participant, (participant: Participant) => participant.poll)
  participants: Participant[];
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Participant } from './participant.entity';

@Entity('Availabilities')
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  // Note: TypeORM does not support tsmultirange natively; handle as text for now, add comment.
  @Column({ type: 'text' })
  slots: string;

  @ManyToOne(() => Participant, (participant: Participant) => participant.availabilities, { nullable: false })
  participant: Participant;
}

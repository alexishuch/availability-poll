import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Participant } from 'src/participants/models/participant.entity';

@Entity('Availabilities')
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'tsmultirange' })
  slot: string;

  @ManyToOne(() => Participant, (participant: Participant) => participant.availabilities, { nullable: false })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;
}

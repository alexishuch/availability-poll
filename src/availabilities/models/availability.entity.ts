import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Participant } from 'src/participants/models/participant.entity';

@Entity('Availabilities')
// There is an index on the slot column to optimize queries on availability slots
// There is a unique constraint on (participant_id, slot) to prevent duplicate availability entries for the same participant and slot
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'tsmultirange' })
  slot: string;

  @ManyToOne(() => Participant, (participant: Participant) => participant.availabilities)
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;
}

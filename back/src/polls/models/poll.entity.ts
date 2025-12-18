import { Participant } from 'src/participants/models/participant.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('Polls')
export class Poll {
  @PrimaryColumn({ type: 'varchar', length: 8, default: () => "substr(gen_random_uuid()::text, 1, 8)" })
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'now()' })
  created_at: Date;

  @OneToMany(() => Participant, (participant: Participant) => participant.poll, { onDelete: 'CASCADE' })
  participants: Participant[];
}

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Candidate } from './candidate.entity';

@Entity()
export class Election {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @OneToMany(() => Candidate, (candidate) => candidate.election)
  candidates: Candidate[];
}

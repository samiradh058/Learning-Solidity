import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Election } from './election.entity';

@Entity()
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  voteCount: number;

  @ManyToOne(() => Election, (election) => election.candidates)
  election: Election;
}

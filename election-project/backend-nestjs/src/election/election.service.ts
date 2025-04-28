import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../entities/candidate.entity';
import { Election } from '../entities/election.entity';

@Injectable()
export class ElectionService {
  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Election)
    private electionRepository: Repository<Election>,
  ) {}

  async createElection(title: string, startTime?: Date, endTime?: Date): Promise<Election> {
    const election = this.electionRepository.create({
      title,
      startTime,
      endTime,
    });
    return this.electionRepository.save(election);
  }
  
  // Get all elections
  async getAllElections(): Promise<Election[]> {
    return this.electionRepository.find();
  }

  // Create a new candidate
  async createCandidate(electionId: number, name: string): Promise<Candidate> {
    const election = await this.electionRepository.findOne({
      where: { id: electionId },
    });
    if (!election) {
      throw new Error('Election not found');
    }

    const candidate = this.candidateRepository.create({
      name,
      voteCount: 0,
      election,
    });

    return this.candidateRepository.save(candidate);
  }

  // Get all candidates for a specific election
  async getCandidatesByElection(electionId: number): Promise<Candidate[]> {
    return this.candidateRepository.find({
      where: { election: { id: electionId } },
    });
  }

  // Get a specific candidate by ID
  async getCandidateById(id: number): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
    });
    if (!candidate) {
      throw new Error('Candidate not found');
    }
    return candidate;
  }
}
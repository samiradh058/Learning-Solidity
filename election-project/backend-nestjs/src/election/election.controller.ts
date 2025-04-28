import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ElectionService } from './election.service';

@Controller('election')
export class ElectionController {
  constructor(
    private blockchainService: BlockchainService,
    private ElectionService: ElectionService,
  ) {}

  @Post('apply')
  async applyAsCandidate(@Body('name') name: string) {
    try {
      // Call to blockchain service
      const tx = await this.blockchainService.applyAsCandidate(name);
      
      // Call to ElectionService to save candidate in DB
      const candidate = await this.ElectionService.createCandidate(4, name); // Use the election ID here
      return { tx, candidate };
    } catch (error) {
      console.error('Error in applyAsCandidate:', error);
      throw new Error('Failed to apply as candidate');
    }
  }

  @Post("check")
  async checkFuntionPost(@Body('name') name: string) {
    return "HEY IT IS RUNNING of post" + name;
  }

  @Post()
async createElection(@Body() body: { title: string; startTime?: Date; endTime?: Date }) {
  const { title, startTime, endTime } = body;
  return this.ElectionService.createElection(title, startTime, endTime);
}

  // Get all elections
  @Get()
  async getAllElections() {
    return this.ElectionService.getAllElections();
  }
  

  @Post('approve/:candidateId')
  async approveCandidate(@Param('candidateId') candidateId: number) {
    return this.blockchainService.approveCandidate(candidateId);
  }

  @Post('vote')
  async vote(@Body('candidateId') candidateId: number) {
    return this.blockchainService.vote(candidateId);
  }

  @Get('candidate/:id')
  async getCandidate(@Param('id') id: number) {
    return this.ElectionService.getCandidateById(id);
  }

  @Get('check')
  async checkFuntion(){
    return "HEY IT IS RUNNING";
  }
}

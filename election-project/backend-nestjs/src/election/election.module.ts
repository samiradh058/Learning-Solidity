import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Candidate } from '../entities/candidate.entity';
import { Election } from '../entities/election.entity';

@Module({
  imports: [ConfigModule,TypeOrmModule.forFeature([Candidate, Election])],
  controllers: [ElectionController],
  providers: [ElectionService, BlockchainService],
})
export class ElectionModule {}

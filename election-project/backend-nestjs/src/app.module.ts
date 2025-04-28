import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectionModule } from './election/election.module';
import { Candidate } from './entities/candidate.entity';
import { Election } from './entities/election.entity';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '192.168.176.1',
      port: 5432,
      username: 'postgres', 
      password: 'Postgres65', 
      database: 'election-db',     
      entities: [Candidate, Election],
      synchronize: true, 
    }),
    ElectionModule,
  ],
})
export class AppModule {}

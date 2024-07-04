import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { SteamStats } from './entities/steam-statistics.entity';
import { User } from '../user/entities/user.entity';
import { GameStats } from './entities/game-statistics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SteamStats, GameStats, User])],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}

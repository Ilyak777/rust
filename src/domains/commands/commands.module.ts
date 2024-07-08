import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commands } from './entity/commands.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { StatisticsService } from '../statistics/statistics.service';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { GameStats } from '../statistics/entities/game-statistics.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Commands, SteamStats, GameStats, User]),
    UserModule,
  ],
  providers: [UserService, StatisticsService],
  controllers: [],
})
export class CommandsModule {}

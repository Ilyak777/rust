import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersService } from './servers.service';
import { ServersController } from './servers.contoller';
import { Server } from './entity/server.entity';
import { ServerWipe } from './entity/server-wipe.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { RconModule } from '../rcon/rcon.module';
import { RedisOptions } from 'src/app/app.config';
import { CommandsModule } from '../commands/commands.module';
import { CommandsService } from '../commands/commands.service';
import { Commands } from '../commands/entity/commands.entity';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/repositories/user.repository';
import { UserPurchasedItemsRepository } from '../user/repositories/user-purchased-items.repository';
import { StatisticsService } from '../statistics/statistics.service';
import { User } from '../user/entities/user.entity';
import { UserPurchasedItems } from '../user/entities/user-purchased-items.entity';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { GameStats } from '../statistics/entities/game-statistics.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      ServerWipe,
      Commands,
      User,
      UserPurchasedItems,
      SteamStats,
      GameStats,
    ]),
    CacheModule.registerAsync(RedisOptions),
    CommandsModule,
  ],
  providers: [
    ServersService,
    CommandsService,
    Commands,
    UserService,
    UserRepository,
    UserPurchasedItemsRepository,
    StatisticsService,
  ],
  controllers: [ServersController],
  exports: [ServersService],
})
export class ServersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { ShopItem } from './entities/shop-item.entity';
import { SetItems } from './entities/set-items.entity';
import { Server } from '../servers/entity/server.entity';
import { ServerWipe } from '../servers/entity/server-wipe.entity';
import { Commands } from '../commands/entity/commands.entity';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { GameStats } from '../statistics/entities/game-statistics.entity';
import { ServersModule } from '../servers/servers.module';
import { UserModule } from '../user/user.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { CommandsModule } from '../commands/commands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShopItem,
      SetItems,
      Server,
      ServerWipe,
      Commands,
      SteamStats,
      GameStats,
      ServersModule,
    ]),
    UserModule,
    StatisticsModule,
    CommandsModule,
  ],
  providers: [ShopService],
  controllers: [ShopController],
})
export class ShopModule {}

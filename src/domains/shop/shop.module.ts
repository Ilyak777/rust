import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { ShopItem } from './entities/shop-item.entity';
import { User } from '../user/entities/user.entity';
import { UserPurchasedItems } from '../user/entities/user-purchased-items.entity';
import { OrderHistory } from '../user/entities/user-order-history.entity';
import { SetItems } from './entities/set-items.entity';
import { ServersService } from '../servers/servers.service';
import { Server } from '../servers/entity/server.entity';
import { ServerWipe } from '../servers/entity/server-wipe.entity';
import { CommandsService } from '../commands/commands.service';
import { Commands } from '../commands/entity/commands.entity';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/repositories/user.repository';
import { UserPurchasedItemsRepository } from '../user/repositories/user-purchased-items.repository';
import { StatisticsService } from '../statistics/statistics.service';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { GameStats } from '../statistics/entities/game-statistics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShopItem,
      User,
      UserPurchasedItems,
      OrderHistory,
      SetItems,
      Server,
      ServerWipe,
      Commands,
      SteamStats,
      GameStats,
    ]),
  ],
  providers: [
    ShopService,
    ServersService,
    CommandsService,
    UserService,
    UserRepository,
    UserPurchasedItemsRepository,
    StatisticsService,
  ],
  controllers: [ShopController],
})
export class ShopModule {}

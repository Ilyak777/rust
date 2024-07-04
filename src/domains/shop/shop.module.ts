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
    ]),
  ],
  providers: [ShopService, ServersService],
  controllers: [ShopController],
})
export class ShopModule {}

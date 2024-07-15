import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { ShopItem } from './entities/shop-item.entity';
import { SetItems } from './entities/set-items.entity';
import { ServersModule } from '../servers/servers.module';
import { UserModule } from '../user/user.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { CommandsModule } from '../commands/commands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopItem, SetItems]),
    StatisticsModule,
    CommandsModule,
    ServersModule,
    UserModule,
  ],
  providers: [ShopService],
  controllers: [ShopController],
  exports: [ShopService],
})
export class ShopModule {}

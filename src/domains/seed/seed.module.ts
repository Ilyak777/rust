import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { ShopItem } from '../shop/entities/shop-item.entity';
import { UserPurchasedItems } from '../user/entities/user-purchased-items.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { OrderHistory } from '../user/entities/user-order-history.entity';
import { GameStats } from '../statistics/entities/game-statistics.entity';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { ProfileData } from '../profile/entities/profile.entity';
import { ProfileSocials } from '../profile/entities/profile-socials.entity';
import { SeederService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ShopItem,
      UserPurchasedItems,
      Integration,
      OrderHistory,
      GameStats,
      SteamStats,
      ProfileData,
      ProfileSocials,
    ]),
  ],
  providers: [SeederService],
})
export class SeederModule {}

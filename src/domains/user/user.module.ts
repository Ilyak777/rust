import appConfig from '../../app/app.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UserPurchasedItemsRepository } from './repositories/user-purchased-items.repository';
import { UserPurchasedItems } from './entities/user-purchased-items.entity';
import { ShopItem } from '../shop/entities/shop-item.entity';
import { ProfileSocials } from '../profile/entities/profile-socials.entity';
import { ProfileData } from '../profile/entities/profile.entity';
import { StatisticsModule } from '../statistics/statistics.module';
import { GameStats } from '../statistics/entities/game-statistics.entity';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { StatisticsService } from '../statistics/statistics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
    }),
    TypeOrmModule.forFeature([
      User,
      ShopItem,
      UserPurchasedItems,
      ProfileData,
      ProfileSocials,
      GameStats,
      SteamStats,
      StatisticsModule,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    JwtModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserPurchasedItemsRepository,
    StatisticsModule,
    StatisticsService,
  ],
  exports: [UserService, UserRepository, UserPurchasedItemsRepository],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SteamStrategy } from './strategy/steam.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/repositories/user.repository';
import { UserPurchasedItemsRepository } from '../user/repositories/user-purchased-items.repository';
import { UserPurchasedItems } from '../user/entities/user-purchased-items.entity';
import { UserModule } from '../user/user.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { StatisticsService } from '../statistics/statistics.service';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { GameStats } from '../statistics/entities/game-statistics.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, UserPurchasedItems, SteamStats, GameStats]),
  ],
  providers: [
    AuthService,
    SteamStrategy,
    JwtStrategy,
    ConfigService,
    UserService,
    UserRepository,
    UserPurchasedItemsRepository,
    StatisticsModule,
    StatisticsService,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

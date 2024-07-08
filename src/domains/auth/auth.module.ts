import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserPurchasedItems } from '../user/entities/user-purchased-items.entity';
import { StatisticsModule } from '../statistics/statistics.module';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { GameStats } from '../statistics/entities/game-statistics.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '365d' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, UserPurchasedItems, SteamStats, GameStats]),
    StatisticsModule,
    UserModule,
  ],
  providers: [AuthService, ConfigService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

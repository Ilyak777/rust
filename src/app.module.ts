import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from './domains/health/health.module';
import appConfig, { RedisOptions } from './app/app.config';
import { DatabaseModule } from './app/database/db.module';
import { AuthModule } from './domains/auth/auth.module';
import { ServersModule } from './domains/servers/servers.module';
import { StatisticsModule } from './domains/statistics/statistics.module';
import { ProfileModule } from './domains/profile/profile.module';
// import { IntegrationModule } from './domains/integrations/integration.module';
import { CacheModule } from '@nestjs/cache-manager';
import { SeederModule } from './domains/seed/seed.module';
import { ShopModule } from './domains/shop/shop.module';
import { UserModule } from './domains/user/user.module';
import { CommandsModule } from './domains/commands/commands.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync(RedisOptions),
    HealthModule,
    UserModule,
    ProfileModule,
    DatabaseModule,
    AuthModule,
    ServersModule,
    StatisticsModule,
    // IntegrationModule,
    CommandsModule,
    SeederModule,
    ShopModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

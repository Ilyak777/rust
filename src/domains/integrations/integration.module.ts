import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OneWinIntegration } from './entities/integration-1win.entity';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';
import { IntegrationRepository } from './integration.repository';
import { Integration } from './entities/integration.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from 'src/app/app.config';
import { UserModule } from '../user/user.module';
import { CommandsModule } from '../commands/commands.module';
import { ServersModule } from '../servers/servers.module';
import { UserRepository } from '../user/repositories/user.repository';
import { SubscriptionModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OneWinIntegration, Integration]),
    CacheModule.registerAsync(RedisOptions),
    UserModule,
    CommandsModule,
    ServersModule,
    SubscriptionModule,
  ],
  providers: [IntegrationService, IntegrationRepository],
  controllers: [IntegrationController],
})
export class IntegrationModule {}

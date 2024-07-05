import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OneWinIntegration } from './entities/integration-1win.entity';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';
import { IntegrationRepository } from './integration.repository';
import { Integration } from './entities/integration.entity';
import { UserRepository } from '../user/repositories/user.repository';
import { User } from '../user/entities/user.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from 'src/app/app.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([OneWinIntegration, Integration, User]),
    CacheModule.registerAsync(RedisOptions),
  ],
  providers: [IntegrationService, IntegrationRepository, UserRepository],
  controllers: [IntegrationController],
})
export class IntegrationModule {}

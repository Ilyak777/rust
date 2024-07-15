import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { Server } from './entity/server.entity';
import { ServerWipe } from './entity/server-wipe.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from 'src/app/app.config';
import { CommandsModule } from '../commands/commands.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Server, ServerWipe]),
    CacheModule.registerAsync(RedisOptions),
  ],
  providers: [ServersService],
  controllers: [ServersController],
  exports: [ServersService],
})
export class ServersModule {}

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersService } from './servers.service';
import { ServersController } from './servers.contoller';
import { Server } from './entity/server.entity';
import { ServerWipe } from './entity/server-wipe.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { RconModule } from '../rcon/rcon.module';
import { RedisOptions } from 'src/app/app.config';

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

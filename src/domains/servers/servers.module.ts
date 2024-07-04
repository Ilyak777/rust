import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersService } from './servers.service';
import { ServersController } from './servers.contoller';
import { Server } from './entity/server.entity';
import { ServerWipe } from './entity/server-wipe.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { RconModule } from '../rcon/rcon.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Server, ServerWipe]),
    CacheModule.register(),
  ],
  providers: [ServersService],
  controllers: [ServersController],
  exports: [ServersService],
})
export class ServersModule {}

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersService } from './services/servers.service';
import { ServersController } from './servers.controller';
import { Server } from './entity/server.entity';
import { ServerWipe } from './entity/server-wipe.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from 'src/app/app.config';
import { CommandsModule } from '../commands/commands.module';
import { RconService } from './services/rcon.service';
import { UserModule } from '../user/user.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Server, ServerWipe]),
    CacheModule.registerAsync(RedisOptions),
    CommandsModule,
    UserModule,
  ],
  providers: [ServersService, RconService],
  controllers: [ServersController],
  exports: [ServersService, RconService],
})
export class ServersModule {}

import { Module } from '@nestjs/common';
import { RconService } from './rcon.service';
import { ServersModule } from '../servers/servers.module';
import { ServersService } from '../servers/servers.service';

@Module({
  imports: [],
  providers: [RconService],
  exports: [RconService],
})
export class RconModule {}

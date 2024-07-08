import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ServersService } from './services/servers.service';
import { Server } from './entity/server.entity';
import { ServerWipe } from './entity/server-wipe.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('servers')
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @ApiOperation({ summary: 'Find all servers' })
  @ApiResponse({ status: 200, description: 'All servers have been retrieved.' })
  @Get()
  findAllServers(): Promise<Server[]> {
    return this.serversService.findAllServers();
  }

  @ApiOperation({ summary: 'Find all server wipes' })
  @ApiResponse({
    status: 200,
    description: 'All server wipes have been retrieved.',
  })
  @Get('wipes')
  findAllWipes(): Promise<ServerWipe[]> {
    return this.serversService.findAllWipes();
  }

  @ApiOperation({ summary: 'Get online status of servers' })
  @ApiResponse({
    status: 200,
    description: 'Online status of servers has been retrieved.',
  })
  @Get('online')
  getServersOnline(): Promise<any> {
    return this.serversService.getAllServerInfo();
  }

  @ApiOperation({ summary: 'Add a new server' })
  @ApiResponse({ status: 201, description: 'The server has been created.' })
  @Post('add')
  addServer(@Body() serverData: Partial<Server>): Promise<Server> {
    return this.serversService.addServer(serverData);
  }

  @ApiOperation({ summary: 'Clear all server caches' })
  @ApiResponse({
    status: 200,
    description: 'All server caches have been cleared.',
  })
  @Delete('clear-cache')
  async clearAllServerCaches() {
    await this.serversService.clearAllServerCaches();
    return { message: 'All server caches have been cleared' };
  }

  @ApiOperation({ summary: 'Add a new server wipe' })
  @ApiResponse({
    status: 201,
    description: 'The server wipe has been created.',
  })
  @Post(':serverId/wipes')
  addWipe(
    @Param('serverId') serverId: number,
    @Body() wipeData: Partial<ServerWipe>,
  ): Promise<ServerWipe> {
    return this.serversService.addWipe(serverId, wipeData);
  }

  // @ApiOperation({ summary: 'Set a map for server' })
  // @ApiResponse({
  //   status: 201,
  //   description: 'The server map has been set.',
  // })
  // @Post(':serverAddress/wipes')
  // setMap(
  //   @Param('serverAddress') serverAddress: string,
  //   map: string,
  // ): Promise<Server> {
  //   return this.serversService.setMap(serverAddress, map);
  // }
}

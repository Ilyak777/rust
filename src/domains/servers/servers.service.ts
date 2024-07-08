import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from './entity/server.entity';
import { ServerWipe } from './entity/server-wipe.entity';
import { Cache } from '@nestjs/cache-manager';
import { Client } from 'rustrcon';
import axios from 'axios';
import { CommandsService } from '../commands/commands.service';
import { Commands } from '../commands/entity/commands.entity';

declare function require(moduleName: string): any;
const { GameDig } = require('gamedig');

@Injectable()
export class ServersService implements OnModuleInit, OnModuleDestroy {
  private rcon: Client;

  constructor(
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(ServerWipe)
    private wipesRepository: Repository<ServerWipe>,
    @Inject(Cache) private cacheManager: Cache,
    private commandService: CommandsService,
  ) {}

  async onModuleInit() {
    console.log('Starting server checking...');
    await this.startChecking();
  }

  onModuleDestroy() {
    if (this.rcon) {
      this.rcon.disconnect();
    }
  }

  async handleRconMessage(message: any): Promise<void> {
    if (
      !message.content ||
      typeof message.content !== 'string' ||
      message.content.includes('disconnecting')
    ) {
      return;
    }

    if (
      message.content.includes('joined') ||
      message.content.includes('joined from ip')
    ) {
      const steamIdMatch = message.content.match(/(\d{17})/);
      if (!steamIdMatch) {
        return;
      }

      const steamId = steamIdMatch[0];
      await this.processUserCommands(steamId);
    }
    return;
  }

  async processUserCommands(steamId: string): Promise<void> {
    const user = await this.commandService.getUserForCommand(steamId);
    if (!user || !user.integration.onewin) {
      return;
    }

    const commands = await this.commandService.getCommandForUserOnServer(
      user.id,
    );

    for (const command of commands) {
      await this.executeCommand(command);
      await this.commandService.removeCommandForUserOnServer(command);
    }
  }

  async executeCommand(command: Commands): Promise<void> {
    this.rcon.send(command, 'M3RCURRRY', 3);
  }

  private async startChecking() {
    const servers = await this.serversRepository.find();

    await Promise.all(
      servers.map(async (server) => {
        let { address, pass } = server;

        address = address.replace(/"/g, '');

        const [rcon_host, rcon_port] = address.split(':');
        const port = parseInt(rcon_port, 10) + 10000;

        const rcon = new Client({
          ip: rcon_host,
          port: port,
          password: pass,
        });

        try {
          await rcon.login();
        } catch (error) {
          console.log(error);
        }

        rcon.on('connected', () => {
          console.log(`Connected to ${rcon.ws.ip}:${rcon.ws.port}`);

          rcon.send('serverinfo', 'M3RCURRRY', 333);

          rcon.send('server.levelurl', 'M3RCURRRY', 222);

          rcon.send('playerlist', 'M3RCURRRY', 444);
        });

        rcon.on('error', (err) => {
          console.error(err);
        });

        rcon.on('disconnect', () => {
          console.log('Disconnected from RCON websocket');
        });

        rcon.on('message', async (message) => {
          await this.handleRconMessage(message);

          if (message.Identifier === 222) {
            try {
              if (!server.rustMapsId) {
                this.getAndSetMap(rcon_host + ':' + rcon_port, message.content);
              }
            } catch (error) {
              console.log(error);
            }
          }
          if (message.Identifier === 444) {
          }
        });
      }),
    );
  }

  async getServers(): Promise<Server[]> {
    return this.serversRepository.find();
  }

  async findById(id: number): Promise<Server[]> {
    return this.serversRepository.find({ where: { id } });
  }

  async findAllServers(): Promise<Server[]> {
    return this.serversRepository.find({ relations: ['wipes'] });
  }

  async findAllWipes(): Promise<ServerWipe[]> {
    return this.wipesRepository.find({ relations: ['server'] });
  }

  async addServer(serverData: Partial<Server>): Promise<Server> {
    const server = this.serversRepository.create(serverData);
    return this.serversRepository.save(server);
  }

  async getAllServerInfo(): Promise<any[]> {
    const servers = await this.serversRepository.find();
    const serverInfos = await Promise.all(
      servers.map(async (server) => {
        let { address } = server;
        address = address.replace(/"/g, '');

        const [host, portStr] = address.split(':');
        const port = parseInt(portStr, 10) + 1;

        const cacheKey = `server-info-${host}:${port}`;

        let serverOnline = await this.cacheManager.get(cacheKey);

        if (!serverOnline) {
          serverOnline = await this.getServerInfoByAddressAndPort(host, port);
          await this.cacheManager.set(cacheKey, serverOnline, 100000);
        } else {
          console.log(`Cache hit for server ${host}:${port}`);
        }
        return Object.assign(server, serverOnline);
      }),
    );

    return serverInfos;
  }

  async clearAllServerCaches(): Promise<void> {
    const servers = await this.serversRepository.find();
    await Promise.all(
      servers.map(async (server) => {
        let { address } = server;
        address = address.replace(/"/g, '');

        const [host, portStr] = address.split(':');
        const port = parseInt(portStr, 10) + 1;
        const cacheKey = `server-info-${host}:${port}`;

        await this.cacheManager.del(cacheKey);
        console.log(`Deleted cache for ${cacheKey}`);
      }),
    );
  }

  async getServerInfoByAddressAndPort(
    address: string,
    port: number,
  ): Promise<any> {
    try {
      const allInfo = await GameDig.query({
        type: 'rust',
        host: address,
        port: port,
      });
      return {
        serverOnline: allInfo.numplayers,
        maxServerOnline: allInfo.maxplayers,
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async addWipe(
    serverId: number,
    wipeData: Partial<ServerWipe>,
  ): Promise<ServerWipe> {
    const server = await this.serversRepository.findOne({
      where: { id: serverId },
    });
    if (!server) {
      throw new Error('Server not found');
    }

    const wipe = this.wipesRepository.create({ ...wipeData, server });
    return this.wipesRepository.save(wipe);
  }

  async getAndSetMap(serverAddress: string, map: string): Promise<Server> {
    const server = await this.serversRepository.findOne({
      where: { address: serverAddress.trim() },
    });

    if (!server) {
      throw new Error('Server not found');
    }

    if (server.rustMapsId) {
      return server;
    }

    let image;
    if (map.includes('files.facepunch.com')) {
      const [size, seed] = map.split('/').at(-1).split('.').slice(1, 3);

      const response = await axios.get(
        `https://api.rustmaps.com/v4/maps/${size}/${seed}`,
        {
          headers: {
            Accept: 'application/json',
            'X-API-Key': 'd88bfe58-d6e5-470c-b007-cd3dd8482eaa',
          },
        },
      );

      image = response.data.data.imageIconUrl;
    } else {
      const id = map.split('/').at(4);

      const response = await axios.get(
        `https://api.rustmaps.com/v4/maps/${id}`,
        {
          headers: {
            Accept: 'application/json',
            'X-API-Key': 'd88bfe58-d6e5-470c-b007-cd3dd8482eaa',
          },
        },
      );

      image = response.data.data.imageIconUrl;
    }

    server.rustMapsId = image;
    return this.serversRepository.save(server);
  }
}

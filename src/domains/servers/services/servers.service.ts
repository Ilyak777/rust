import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from '@nestjs/cache-manager';
import { Client } from 'rustrcon';
import axios from 'axios';
import { ServerWipe } from '../entity/server-wipe.entity';
import { Server } from '../entity/server.entity';
import { CommandsService } from 'src/domains/commands/commands.service';

@Injectable()
export class ServersService implements OnModuleInit, OnModuleDestroy {
  private rconClients: Map<number, Client> = new Map();
  private serverUserSets: Map<number, Set<string>> = new Map();

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
    this.rconClients.forEach((rcon) => {
      rcon.disconnect();
    });
  }

  async handleRconMessage(message: any, serverId: number): Promise<void> {
    if (!message.content || typeof message.content !== 'string') return;

    const userSet = this.serverUserSets.get(serverId);
    if (!userSet) return;

    if (
      message.content.includes('joined') ||
      message.content.includes('joined from ip')
    ) {
      const match = message.content.match(/(\d{17})/);
      if (!match) return;

      const steamId = match[0];
      userSet.add(steamId);
      console.log(`User ${steamId} connected to server ${serverId}`);
    }

    if (message.content.includes('disconnecting')) {
      const match = message.content.match(/\/(\d{17})\//);
      if (!match) return;

      const steamId = match[1];
      userSet.delete(steamId);
      console.log(`User ${steamId} disconnected from server ${serverId}`);
    }
  }

  private async startChecking() {
    const servers = await this.serversRepository.find();

    await Promise.all(
      servers.map(async (server) => {
        let { address, pass } = server;

        address = address.replace(/"/g, '');

        const [rcon_host, rcon_port] = address.split(':');
        let port;
        if (parseInt(rcon_port, 10) === 50000) {
          port = parseInt(rcon_port, 10) + 1;
        } else {
          port = parseInt(rcon_port, 10) + 10000;
        }

        const rcon = new Client({
          ip: rcon_host,
          port: port,
          password: pass,
        });

        try {
          await rcon.login();
          this.rconClients.set(server.id, rcon);
          this.serverUserSets.set(server.id, new Set<string>());
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
          await this.handleRconMessage(message, server.id);

          if (message.Identifier === 222) {
            try {
              if (!server.rustMapsId) {
                this.getAndSetMap(rcon_host + ':' + rcon_port, message.content);
              }
            } catch (error) {
              console.log(error);
            }
          }
          if (message.Identifier === 333) {
            const cacheKey = `server-info-${rcon_host}:${port}`;
            const cachedResult = await this.cacheManager.get(cacheKey);
            if (cachedResult) {
              await this.cacheManager.del(cacheKey);
            }
            const serverOnline = {
              serverOnline: message.content.Players,
              maxServerOnline: message.content.MaxPlayers,
            };
            await this.cacheManager.set(cacheKey, serverOnline, 10000);
          }

          if (message.Identifier === 444) {
            this.updateUserSet(server.id, message.content);
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
        const port = parseInt(portStr, 10) + 10000;

        const cacheKey = `server-info-${host}:${port}`;

        let serverOnline = await this.cacheManager.get(cacheKey);

        if (!serverOnline) {
          const rcon = this.rconClients.get(server.id);
          if (rcon) {
            rcon.send('serverinfo', 'M3RCURRRY', 333);
          } else {
            console.log(`No RCON client for server ${server.id}`);
          }

          serverOnline = await this.cacheManager.get(cacheKey);
        }

        console.log(`Cache hit for server ${host}:${port}`);

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

  updateUserSet(serverId: number, content: any): void {
    const userSet = this.serverUserSets.get(serverId);
    if (!userSet) return;

    content.forEach((user: any) => {
      userSet.add(user.SteamID);
    });

    this.checkAndExecuteCommands(serverId);
  }

  async checkAndExecuteCommands(serverId: number): Promise<void> {
    const userSet = this.serverUserSets.get(serverId);
    try {
      const commands = await this.commandService.findByServerId(serverId);
      if (!commands || !commands[0].user) return;
      // if (!userSet) return;

      commands.forEach(async (command) => {
        if (userSet.has(command.user.steamId)) {
          const rcon = this.rconClients.get(serverId);
          if (rcon) {
            rcon.send(command.command, 'M3RCURRRY', 3);
            await this.commandService.deleteCommand(command);
          }
        }
      });
    } catch (error) {
      console.log(error);
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

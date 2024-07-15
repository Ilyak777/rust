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
import { ServerWipe } from './entity/server-wipe.entity';
import { Server } from './entity/server.entity';
import { CommandsService } from 'src/domains/commands/commands.service';
import { isArray, IsString } from 'class-validator';
import logger from '../../app/log';

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
    logger.debug('Starting server checking...');
    await this.startChecking();
  }

  onModuleDestroy() {
    this.rconClients.forEach((rcon) => {
      rcon.disconnect();
    });
  }

  private async handleRconMessage(
    message: any,
    serverId: number,
  ): Promise<void> {
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
      logger.debug(
        `User with steamId ${steamId} connected to with Id  ${serverId}`,
      );
      await this.updateUserSet(serverId, steamId.trim());
    }

    if (message.content.includes('disconnecting')) {
      const match = message.content.match(/\/(\d{17})\//);
      if (!match) return;

      const steamId = match[1];
      logger.debug(
        `User with steamId ${steamId} disconnected from server with Id ${serverId}`,
      );

      userSet.delete(steamId.trim());
    }
  }

  private async startChecking() {
    const servers = await this.serversRepository.find();

    await Promise.all(
      servers.map(async (server) => {
        let { address } = server;
        const { pass } = server;

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
          logger.error(`Error while connecting to RCON ${error.message}`);
        }

        rcon.on('connected', () => {
          logger.debug(`Connected to ${rcon.ws.ip}:${rcon.ws.port}`);

          rcon.send('server.levelurl', 'M3RCURRRY', 222);

          rcon.send('serverinfo', 'M3RCURRRY', 333);

          rcon.send('playerlist', 'M3RCURRRY', 444);
        });

        rcon.on('error', (err) => {
          logger.error(`Error after connection to RCON ${err.message}`);
        });

        rcon.on('disconnect', () => {
          logger.debug('Disconnected from RCON websocket');
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
            await this.cacheManager.set(cacheKey, serverOnline, 10);
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
    return this.serversRepository.find();
  }

  async findAllWipes(): Promise<ServerWipe[]> {
    return this.wipesRepository.find({ relations: ['server'] });
  }

  async addServer(serverData: Partial<Server>): Promise<Server> {
    const server = this.serversRepository.create(serverData);
    return this.serversRepository.save(server);
  }

  async getServerOnline(): Promise<any[]> {
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
            logger.debug(`No RCON client for server ${server.id}`);
          }

          serverOnline = await this.cacheManager.get(cacheKey);
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
      }),
    );
  }

  private async updateUserSet(serverId: number, content: any): Promise<void> {
    const userSet = this.serverUserSets.get(serverId);
    if (!userSet) return;

    if (isArray(content)) {
      content.forEach((user: any) => {
        userSet.add(user.SteamID);
      });
    }
    if (IsString(content)) {
      userSet.add(content);
    }

    await this.checkAndExecuteCommands(serverId);
  }

  async checkAndExecuteCommands(serverId: number): Promise<void> {
    try {
      const userSet = this.serverUserSets.get(serverId);
      if (userSet.size < 1) return;
      const commands = await this.commandService.findByServerId(serverId);

      if (commands.length < 1) return;
      commands.forEach(async (command) => {
        if (!command.user) {
          return;
        }
        if (userSet.has(command.user.steamId)) {
          const rcon = this.rconClients.get(serverId);
          if (rcon) {
            rcon.send(command.command, 'M3RCURRRY', 3);
            await this.commandService.deleteCommand(command);
            logger.info(
              `user ${command.user.steamId} was granted with a ${command.type}`,
            );
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async executeStraightCommand(
    command: string,
    serverId: number,
    steamId: string,
  ): Promise<void> {
    try {
      const rcon = this.rconClients.get(serverId);
      const type = command.includes('skinbox.nickname')
        ? 'SKINBOX'
        : 'SUBSCRIPTION';
      if (rcon) {
        rcon.send(command, 'M3RCURRRY', 3);
        logger.info(`user ${steamId} was granted with a ${type}`);
      }
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

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

  private async startChecking() {
    const servers = await this.serversRepository.find();
    await Promise.all(
      servers.map(async (server) => {
        let { address, pass } = server;

        address = address.replace(/"/g, '');

        const [rcon_host, rcon_port] = address.split(':');
        const port = parseInt(rcon_port, 10) + 10000;
        const rcon_password = 'kGkMdsdWersajwsUc1H';

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
          // Get server map
          rcon.send('serverinfo', 'M3RCURRRY', 333);
          // Get server info
          rcon.send('server.levelurl', 'M3RCURRRY', 222);
        });

        rcon.on('error', (err) => {
          console.error(err);
        });

        rcon.on('disconnect', () => {
          console.log('Disconnected from RCON websocket');
        });

        rcon.on('message', (message) => {
          console.log(message);

          if (message.Identifier === 222) {
            try {
              this.setMap(rcon_host + ':' + rcon_port, message.content);
              console.log('Server info:', message);
            } catch (error) {
              console.log(error);
            }
          } else if (message.Identifier === 222) {
            console.log('Level URL:', message);
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

  async setMap(serverAddress: string, map: string): Promise<Server> {
    const server = await this.serversRepository.findOne({
      where: { address: serverAddress.trim() },
    });

    if (!server) {
      throw new Error('Server not found');
    }

    if (server.rustMapsId) {
      return server;
    }

    server.rustMapsId = map;
    return this.serversRepository.save(server);
  }
}

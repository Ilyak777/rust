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
export class ServersService {
  private rcon: Client;

  constructor(
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(ServerWipe)
    private wipesRepository: Repository<ServerWipe>,
    @Inject(Cache) private cacheManager: Cache,
  ) {}

  // onModuleInit() {
  //   this.startChecking();
  // }

  // onModuleDestroy() {
  //   if (this.rcon) {
  //     this.rcon.disconnect();
  //   }
  // }

  // startChecking = async () => {
  //   const servers = await this.serversRepository.find();
  //   const serverInfos = Promise.all(
  //     servers.map(async (server) => {
  //       let { address } = server;
  //       address = address.replace(/"/g, '');

  //       const [rcon_host, rcon_port] = address.split(':');
  //       const port = parseInt(rcon_port, 10) + 1;
  //       const rcon_password = 'kGkMdsdWersajwsUc1H';
  //     }),
  //   );

  //   console.log(123);

  //   const rcon = new Client({
  //     ip: rcon_host,
  //     port: rcon_port,
  //     password: rcon_password,
  //   });

  //   try {
  //     rcon.login();
  //   } catch (error) {
  //     console.log(error);
  //   }

  //   rcon.on('connected', () => {
  //     console.log(`Connected to ${rcon.ws.ip}:${rcon.ws.port}`);

  //     // ПОЛУЧЕНИЕ КАРТЫ СЕРВЕРА
  //     rcon.send('serverinfo', 'M3RCURRRY', 3);
  //     // ПОЛУЧЕНИЕ ИНФЫ О СЕРВЕРЕ
  //     rcon.send('server.levelurl', 'M3RCURRRY', 3);
  //   });

  //   rcon.on('error', (err) => {
  //     console.error(err);
  //   });

  //   rcon.on('disconnect', () => {
  //     console.log('Disconnected from RCON websocket');
  //   });

  //   rcon.on('message', (message) => {
  //     console.log(message);

  //     if (message.Identifier === 333) {
  //       try {
  //         console.log(rcon_host + ':' + rcon_port);

  //         this.setMap(rcon_host + ':' + rcon_port, message.content);
  //         console.log('Server info:', message);
  //       } catch (error) {
  //         console.log(error);
  //       }
  //     } else if (message.Identifier === 222) {
  //       console.log('Level URL:', message);
  //     }
  //   });
  // };

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
        const x = await this.cacheManager.get(cacheKey);

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
    const x = await this.serversRepository.find();

    const server = await this.serversRepository.findOne({
      where: { address: serverAddress.toString().trimStart().trimEnd() },
    });

    if (!server) {
      throw new Error('Server not found');
    }

    if (server.rustMapsId) {
      return server;
    }

    server.rustMapsId = map;

    const serverToReturn = await this.serversRepository.save(server);
    return serverToReturn;
  }
}

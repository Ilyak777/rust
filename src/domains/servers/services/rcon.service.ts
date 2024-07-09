import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { Client } from 'rustrcon';
import { Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entity/server.entity';
import { CommandsService } from '../../commands/commands.service';
import { ServersService } from './servers.service';

@Injectable()
export class RconService implements OnModuleInit, OnModuleDestroy {
  private rconClients: Map<number, Client> = new Map();
  private serverUserSets: Map<number, Set<string>> = new Map();
  private playerlistInterval: NodeJS.Timeout;
  private serverService: ServersService;

  constructor(
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @Inject(Cache) private cacheManager: Cache,
    private commandService: CommandsService,
  ) {}

  async onModuleInit() {
    console.log('Initializing RCON connections...');
    await this.startChecking();
  }

  onModuleDestroy() {
    this.rconClients.forEach((rcon) => {
      rcon.disconnect();
    });
    if (this.playerlistInterval) {
      clearInterval(this.playerlistInterval);
    }
  }

  async getRconClient(serverId: number) {
    return this.rconClients.get(serverId);
  }

  private async startChecking() {
    const servers = await this.serversRepository.find();

    await Promise.all(
      servers.map(async (server) => {
        let { address } = server;
        const { pass } = server;

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
          this.rconClients.set(server.id, rcon);
          this.serverUserSets.set(server.id, new Set<string>());
        } catch (error) {
          console.log(error);
        }

        rcon.on('connected', () => {
          console.log(`Connected to ${rcon.ws.ip}:${rcon.ws.port}`);

          rcon.send('server.levelurl', 'M3RCURRRY', 222);

          rcon.send('serverinfo', 'M3RCURRRY', 333);

          rcon.send('playerlist', 'M3RCURRRY', 444);
        });

        rcon.on('error', (err) => {
          console.error(err);
        });

        rcon.on('disconnect', () => {
          console.log('Disconnected from RCON websocket');
          if (this.playerlistInterval) {
            clearInterval(this.playerlistInterval);
          }
        });

        rcon.on('message', async (message) => {
          console.log('--------------->', message);

          await this.handleRconMessage(message, server.id);

          if (message.Identifier === 222) {
            try {
              if (!server.rustMapsId) {
                this.serverService.getAndSetMap(
                  rcon_host + ':' + rcon_port,
                  message.content,
                );
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
      console.log('match on connect--->', match);

      const steamId = match[0];
      userSet.add(steamId);
    }

    if (message.content.includes('disconnecting')) {
      const match = message.content.match(/\/(\d{17})\//);
      if (!match) return;
      console.log('match on disconnect--->', match);

      const steamId = match[1];
      console.log('steamId on disconnect-------->', steamId);

      userSet.delete(steamId);
    }
  }

  private async updateUserSet(serverId: number, content: any): Promise<void> {
    const userSet = this.serverUserSets.get(serverId);
    if (!userSet) return;

    content.forEach((user: any) => {
      userSet.add(user.SteamID);
    });

    await this.checkAndExecuteCommands(serverId);
  }

  private async checkAndExecuteCommands(serverId: number): Promise<void> {
    const userSet = this.serverUserSets.get(serverId);
    if (!userSet) return;

    const commands = await this.commandService.findByServerId(serverId);
    if (!commands) return;
    commands.forEach(async (command) => {
      if (userSet.has(command.user.steamId)) {
        const rcon = this.rconClients.get(serverId);
        if (rcon) {
          rcon.send(command.command, 'M3RCURRRY', 3);
          await this.commandService.deleteCommand(command);
          console.debug(
            `user ${command.user.steamId} was granted with a ${command.type}`,
          );
        }
      }
    });
  }
}

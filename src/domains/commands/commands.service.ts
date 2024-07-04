import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../servers/entity/server.entity';
import { Commands } from './entity/commands.entity';
import { IntegrationService } from '../integrations/integration.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CommandsService {
  constructor(
    @InjectRepository(Commands)
    private readonly commandsRepository: Repository<Commands>,
    private readonly integrationService: IntegrationService,
    private readonly configService: ConfigService,
  ) {}

  async getCommandsForUserOnServer(
    userId: number,
    serverId: number,
  ): Promise<Commands[]> {
    return this.commandsRepository.find({
      where: {
        user: { id: userId },
        server: { id: serverId },
      },
    });
  }

  async checkAndGrantSkinbox(
    userId: number,
    steamId: string,
    serverId: number,
  ): Promise<void> {
    const hasOneWinIntegration = await this.integrationService.checkIntegration(
      userId,
    );
    if (hasOneWinIntegration) {
      const command = `o.grant user ${steamId} skinbox.nickname`;
      const server = await this.integrationService.findOne(serverId);
      const user = await this.integrationService.findOne(userId);

      const newCommand = this.commandsRepository.create({
        command,
        user,
        server,
      });
      await this.commandsRepository.save(newCommand);

      this.sendCommandToServer(server, command);
    }
  }

  private sendCommandToServer(server: Server, command: string): void {
    const ip = this.configService.get('RCON_IP');
    const port = this.configService.get('RCON_PORT');
    const rconPassword = this.configService.get('RCOP_PASS');
    const rcon = new Client({ ip, port, password: rconPassword });

    rcon.login();
    rcon.on('connected', () => {
      rcon.send(command);
    });

    rcon.on('error', (err) => {
      console.error(err);
    });

    rcon.on('disconnect', () => {
      console.log('Disconnected from RCON websocket');
    });
  }
}

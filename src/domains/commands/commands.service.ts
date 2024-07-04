import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../servers/entity/server.entity';
import { Commands } from './entity/commands.entity';
// import { IntegrationService } from '../integrations/integration.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CommandsService {
  constructor(
    @InjectRepository(Commands)
    private readonly commandsRepository: Repository<Commands>,
    private readonly integrationService: any,
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

  async grantSkinbox(userId: number, steamId: string): Promise<void> {}
}

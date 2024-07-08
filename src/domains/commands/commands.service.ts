import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commands } from './entity/commands.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class CommandsService {
  constructor(
    @InjectRepository(Commands)
    private readonly commandsRepository: Repository<Commands>,
    private userService: UserService,
  ) {}

  async findByServerId(serverId: number) {
    return await this.commandsRepository.find({
      where: { server: { id: serverId } },
      relations: ['user', 'server'],
    });
  }

  async deleteCommand(command: Commands) {
    return await this.commandsRepository.delete(command);
  }

  async getCommandForUserOnServer(
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

  async removeCommandForUserOnServer(command: Commands): Promise<any> {
    const id = command.id;
    return this.commandsRepository.delete({ id });
  }

  async saveCommand(userId: number): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user || !user.steamId) {
      throw new Error('User not found or no Steam ID');
    }

    const command = `o.grant user ${user.steamId} skinbox.nickname`;
    const newCommand = this.commandsRepository.create({
      command: command,
      user: { id: userId },
    });

    await this.commandsRepository.save(newCommand);
  }

  async getUserForCommand(steamId: string): Promise<any> {
    try {
      const user = await this.userService.findBySteamId(steamId);
      return user;
    } catch (error) {
      console.log(error);
    }
  }

  async grantSkinbox(
    userId: number,
    steamId: string,
    serverId: number,
  ): Promise<void> {
    const userToGrant = await this.userService.findById(userId);
    if (!userToGrant || !userToGrant.steamId) {
      throw new Error('User not found or no Steam ID');
    }

    const command = `o.grant user ${userToGrant.steamId} skinbox.nickname`;
    const newCommand = this.commandsRepository.create({
      command: command,
      user: { id: userId },
      server: { id: serverId },
    });

    await this.commandsRepository.save(newCommand);
  }
}

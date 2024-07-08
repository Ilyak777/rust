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

  async getCommandForUserOnServer(userId: number): Promise<Commands[]> {
    return this.commandsRepository.find({
      where: {
        user: { id: userId },
      },
    });
  }

  async removeCommandForUserOnServer(command: Commands): Promise<any> {
    const id = command.id;
    return this.commandsRepository.delete({ id });
  }

  async saveCommand(userId: number, steamId: string): Promise<void> {
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

  async grantSkinbox(userId: number, steamId: string): Promise<void> {
    const userToGrant = await this.userService.findById(userId);
    if (!userToGrant || !userToGrant.steamId) {
      throw new Error('User not found or no Steam ID');
    }

    const command = `o.grant user ${userToGrant.steamId} skinbox.nickname`;
    const newCommand = this.commandsRepository.create({
      command: command,
      user: { id: userId },
    });

    await this.commandsRepository.save(newCommand);
  }
}

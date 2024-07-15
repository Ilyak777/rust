import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commands } from './entity/commands.entity';
import { UserService } from '../user/user.service';
import { CommandsTypeE } from './enum/commands-type.enum';
import logger from 'src/app/log';
import { SubscriptionService } from '../subscriptions/subscriptions.service';

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

  async saveCommand(
    userId: number,
    serverId: number,
    commandStr: string,
  ): Promise<void> {
    try {
      const newCommand = this.commandsRepository.create({
        command: commandStr,
        user: { id: userId },
        server: { id: serverId },
        type: CommandsTypeE.SUBSCRIPTION,
      });

      await this.commandsRepository.save(newCommand);
    } catch (error) {
      logger.error(`Error while saving command ${error}`);
      throw new Error('Error while saving command');
    }
  }

  async getUserForCommand(steamId: string): Promise<any> {
    try {
      const user = await this.userService.findBySteamId(steamId);
      return user;
    } catch (error) {
      console.log(error);
    }
  }

  async grantSkinbox(userId: number, serverId: number): Promise<void> {
    const userToGrant = await this.userService.findById(userId);
    if (!userToGrant || !userToGrant.steamId) {
      throw new Error('User not found or no Steam ID');
    }

    const command = `o.grant user ${userToGrant.steamId} skinbox.nickname`;
    const newCommand = this.commandsRepository.create({
      command: command,
      type: CommandsTypeE.SKINBOX,
      user: { id: userId },
      server: { id: serverId },
    });

    await this.commandsRepository.save(newCommand);
  }

  async grantVIP(userId: number): Promise<void> {
    const userToGrant = await this.userService.findById(userId);
    if (!userToGrant || !userToGrant.steamId) {
      throw new Error('User not found or no Steam ID');
    }

    const command = `addgroup ${userToGrant.steamId} vip 3d`;

    const newCommand = this.commandsRepository.create({
      command: command,
      type: CommandsTypeE.SUBSCRIPTION,
      user: { id: userId },
      server: { id: 3 },
    });

    await this.commandsRepository.save(newCommand);
  }

  // async grantSkinboxAndVIP(userId: number, serverId: number): Promise<void> {
  //   const userToGrant = await this.userService.findById(userId);
  //   if (!userToGrant || !userToGrant.steamId) {
  //     throw new Error('User not found or no Steam ID');
  //   }

  // const skinboxCommandToSave = `o.grant user ${userToGrant.steamId} skinbox.nickname`;
  // const vipCommandToSave = `addgroup ${userToGrant.steamId} vip 3d`;

  //   const skinboxCommand = this.commandsRepository.create({
  //     command: skinboxCommandToSave,
  //     type: CommandsTypeE.SKINBOX,
  //     user: { id: userId },
  //     server: { id: serverId },
  //   });

  //   const vipCommand = this.commandsRepository.create({
  //     command: vipCommandToSave,
  //     type: CommandsTypeE.SKINBOX,
  //     user: { id: userId },
  //     server: { id: serverId },
  //   });

  //   const arrayToSend = [vipCommandToSave, skinboxCommandToSave];

  //   await this.commandsRepository.save(skinboxCommand);
  //   await this.commandsRepository.save(vipCommand);
  // }
}

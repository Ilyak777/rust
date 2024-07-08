import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UserPurchasedItems } from './entities/user-purchased-items.entity';
import { UserPurchasedItemsRepository } from './repositories/user-purchased-items.repository';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UserRoleE } from './enums/user-role.enum';
import { StatisticsService } from '../statistics/statistics.service';

@Injectable()
export class UserService {
  constructor(
    private repo: UserRepository,
    private itemsRepo: UserPurchasedItemsRepository,
    private configService: ConfigService,
    private statsService: StatisticsService,
  ) {}

  async createUser(user: User) {
    return this.repo.create(user);
  }

  async updateUser(id: number, user: User) {
    return this.repo.update(id, user);
  }

  async findById(userId: number) {
    return this.repo.findById(userId);
  }

  async getMe(userId: number): Promise<User> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findBySteamId(steamId: string) {
    return this.repo.findBySteamId(steamId);
  }

  async findUserIntegration(id: number) {
    return this.repo.findUserIntegration(id);
  }

  async getUserProfile(userId: number) {
    return this.repo.getUserProfile(userId);
  }

  async getUserPurchasedItems(userId: number): Promise<UserPurchasedItems[]> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.itemsRepo.findAllUserItems(user);
  }

  async updateUserStatistics(steamId: string) {
    const steamApiKey = this.configService.get<string>('STEAM_API_KEY');
    const user = await this.findBySteamId(steamId);

    const { data: vacResponse } = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${steamApiKey}&steamids=${steamId}`,
    );

    const vacCount = { vacCount: vacResponse.players[0].NumberOfVACBans };

    return await this.statsService.updateSteamStats(user.id, vacCount);
  }

  async changeUserRole(
    requestOwnerId: string,
    userId: string,
    newRole: UserRoleE,
  ): Promise<User> {
    if (requestOwnerId === userId) {
      throw new BadRequestException('Changing own role is not allowed');
    }

    const requestOwnerUser = await this.repo.findBySteamId(requestOwnerId);
    const user = await this.repo.findBySteamId(userId);

    if (!requestOwnerUser || !user) {
      throw new NotFoundException('User not found');
    }

    if (newRole === UserRoleE.OWNER) {
      throw new BadRequestException('Cannot assign owner role');
    }

    if (user.role === UserRoleE.OWNER) {
      throw new BadRequestException('Cannot change owner role');
    }

    switch (requestOwnerUser.role) {
      case UserRoleE.ADMIN:
        if ([UserRoleE.ADMIN, UserRoleE.OWNER].includes(newRole)) {
          throw new BadRequestException(
            'Admin cannot assign roles higher than moderator',
          );
        }
        break;
      case UserRoleE.OWNER:
        break;
      default:
        throw new BadRequestException('Insufficient permissions');
    }

    user.role = newRole;
    return this.repo.create(user);
  }
}

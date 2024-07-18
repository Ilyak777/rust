import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Integration } from 'src/domains/integrations/entities/integration.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private repository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  public async findOrErr(id: number): Promise<User[]> {
    const user = await this.repository.find({ where: { id: id } });
    if (!user) {
      throw new Error('err in findOrErr');
    }
    return user;
  }

  public async findByIdWithSubscriptions(id: number): Promise<User> {
    return await this.repository.findOne({
      where: { id },
      relations: ['activeSubscriptions', 'activeSubscriptions.subscriptions'],
    });
  }

  public async findById(id: number): Promise<User> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'profileData',
        'profileData.socials',
        'steamStats',
        'integration',
        'integration.onewin',
      ],
    });
  }

  public async findUserIntegration(id: number): Promise<Integration> {
    const user = await this.repository.findOne({
      where: { id },
      relations: ['integration', 'integration.onewin', 'integration.onewinOld'],
    });

    return user.integration;
  }

  public async getUserProfile(id: number): Promise<User> {
    const user = await this.repository.findOne({
      where: { id },
      relations: ['profileData', 'profileData.socials'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  public async findByUsernameOrErr(username: string): Promise<User> {
    const user = await this.repository.findOne({ where: { username } });
    if (!user) {
      throw new Error('err in findByUsername');
    }
    return user;
  }

  public async findBySteamId(steamId: string): Promise<User> {
    try {
      return await this.repository.findOne({
        where: { steamId },
        relations: [
          'profileData',
          'profileData.socials',
          'steamStats',
          'integration',
          'integration.onewin',
        ],
      });
    } catch (error) {
      console.log(error);
    }
  }

  public async findBySteamIdOrErr(steamId: string): Promise<User> {
    const user = await this.repository.findOne({ where: { steamId } });
    if (!user) {
      throw new Error('err in findBySteamIdOrErr');
    }
    return user;
  }

  public async create(user: User): Promise<User> {
    const createdUser = await this.repository.create(user);
    if (!createdUser) {
      throw new Error('err in createUser');
    }
    return await this.repository.save(createdUser);
  }

  public async save(user: User): Promise<User> {
    const createdUser = await this.repository.save(user);
    return createdUser;
  }

  async update(id: number, user: Partial<User>): Promise<void> {
    await this.repository.update(id, user);
  }

  async updateUserIntegration(
    id: number,
    integration: Integration | null,
  ): Promise<void> {
    await this.repository.update(id, { integration: integration });
  }

  async deleteUserIntegration(
    id: number,
    integration: Integration,
  ): Promise<void> {
    await this.repository.decrement({ id: id }, 'integration', 1);
  }

  async addTestBalance(id: number): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      const user = await entityManager.findOne(User, { where: { id: id } });

      if (user) {
        user.balance += 1.14;
        await entityManager.update(User, user.id, {
          balance: user.balance,
        });
      }
    });
  }
}

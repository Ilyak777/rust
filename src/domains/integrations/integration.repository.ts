import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OneWinIntegration } from './entities/integration-1win.entity';
import { Integration } from './entities/integration.entity';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/repositories/user.repository';
import { OneWinIntegrationHistory } from './entities/integration-1win-history.entity';

@Injectable()
export class IntegrationRepository {
  constructor(
    @InjectRepository(OneWinIntegration)
    private oneWinRepository: Repository<OneWinIntegration>,
    @InjectRepository(Integration)
    private userIntegration: Repository<Integration>,
    @InjectRepository(OneWinIntegrationHistory)
    private integrationHistory: Repository<OneWinIntegrationHistory>,
    private userService: UserService,
  ) {}

  async getOneWinIntegration(clientId: string): Promise<OneWinIntegration> {
    return this.oneWinRepository.findOne({ where: { clientId } });
  }

  async createOneWinIntegration(
    userId: number,
    clientId: string,
    clientEmail: string,
  ): Promise<OneWinIntegration> {
    const userIntegrations = await this.userService.findUserIntegration(userId);

    if (!userIntegrations || !userIntegrations.onewin) {
      const oldIntegration = await this.integrationHistory.findOne({
        where: { clientId: clientId },
      });
      if (oldIntegration) {
        throw new BadRequestException('onewin-client-already-exists');
      }

      const user = await this.userService.findById(userId);
      if (!user) {
        throw new BadRequestException('user-not-found');
      }

      const winIntegration = this.oneWinRepository.create({
        clientId,
        clientEmail,
      });
      const integrationDone = await this.oneWinRepository.save(winIntegration);

      const savedInHistoryIntegration = this.integrationHistory.create({
        clientId: clientId,
      });
      await this.integrationHistory.save(savedInHistoryIntegration);

      const createdIntegration = await this.userIntegration.create({
        user: user,
        onewin: winIntegration,
      });
      const savedIntegration = await this.userIntegration.save(
        createdIntegration,
      );

      await this.userService.updateUserIntegration(userId, savedIntegration);
      await this.userService.addTestBalance(userId);

      return integrationDone;
    } else {
      throw new BadRequestException(
        'user-integration-with-1win-already-exists',
      );
    }
  }

  async updateOneWinIntegration(
    id: number,
    clientId: string,
  ): Promise<OneWinIntegration> {
    await this.oneWinRepository.update(id, { clientId: clientId });
    return this.oneWinRepository.findOne({ where: { id: id } });
  }

  async checkClientThatExists(
    clientId: string,
  ): Promise<OneWinIntegrationHistory> {
    return this.integrationHistory.findOne({ where: { clientId: clientId } });
  }

  async deleteUserIntegrationAndCheck(
    userId: number,
    clientId: string,
  ): Promise<void> {
    await this.userIntegration.delete(userId);

    const oneWinIntegration = await this.oneWinRepository.findOne({
      where: { clientId },
    });

    if (!oneWinIntegration) {
      return;
    } else {
      await this.oneWinRepository.delete(clientId);
      return;
    }
  }
}

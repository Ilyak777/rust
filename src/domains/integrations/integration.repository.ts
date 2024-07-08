import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OneWinIntegration } from './entities/integration-1win.entity';
import { Integration } from './entities/integration.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class IntegrationRepository {
  constructor(
    @InjectRepository(OneWinIntegration)
    private oneWinRepository: Repository<OneWinIntegration>,
    @InjectRepository(Integration)
    private userIntegration: Repository<Integration>,
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
    let userIntegrations = await this.userService.findUserIntegration(userId);

    if (!userIntegrations) {
      const user = await this.userService.findById(userId);
      const winIntegration = await this.oneWinRepository.findOne({
        where: { clientId: clientId },
      });
      if (!user) {
        throw new BadRequestException('user-not-found');
      }
      userIntegrations = await this.userIntegration.create({
        user: user,
        onewin: winIntegration,
      });

      userIntegrations = await this.userIntegration.save(userIntegrations);
    }

    if (userIntegrations && userIntegrations.onewin) {
      throw new BadRequestException('onewin-already-exists');
    }

    const integration = this.oneWinRepository.create({
      clientId,
      clientEmail,
    });

    const integrationDone = await this.oneWinRepository.save(integration);

    userIntegrations.onewin = integrationDone;
    await this.userIntegration.save(userIntegrations);

    return integrationDone;
  }

  async updateOneWinIntegration(
    id: number,
    clientId: string,
  ): Promise<OneWinIntegration> {
    await this.oneWinRepository.update(id, { clientId });
    return this.oneWinRepository.findOne({ where: { id } });
  }
}

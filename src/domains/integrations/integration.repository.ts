import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OneWinIntegration } from './entities/integration-1win.entity';
import { Integration } from './entities/integration.entity';

@Injectable()
export class IntegrationRepository {
  constructor(
    @InjectRepository(OneWinIntegration)
    private oneWinRepository: Repository<OneWinIntegration>,
    @InjectRepository(Integration)
    private userIntegration: Repository<Integration>,
  ) {}

  async getOneWinIntegration(clientId: string): Promise<OneWinIntegration> {
    return this.oneWinRepository.findOne({ where: { clientId } });
  }

  async createOneWinIntegration(
    userId: number,
    clientId: string,
    clientEmail: string,
  ): Promise<OneWinIntegration> {
    const userIntegrations = await this.userIntegration.findOne({
      where: { user: { id: userId } },
    });
    if (userIntegrations.onewin) {
      throw new BadRequestException('onewin-already-exists');
    }
    const integration = this.oneWinRepository.create({
      clientId,
      clientEmail,
      Integrations: userIntegrations,
    });

    return this.oneWinRepository.save(integration);
  }

  async updateOneWinIntegration(
    id: number,
    clientId: string,
  ): Promise<OneWinIntegration> {
    await this.oneWinRepository.update(id, { clientId });
    return this.oneWinRepository.findOne({ where: { id } });
  }
}

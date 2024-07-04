import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OneWinIntegration } from './entities/integration-1win.entity';

@Injectable()
export class IntegrationRepository {
  constructor(
    @InjectRepository(OneWinIntegration)
    private oneWinRepository: Repository<OneWinIntegration>,
  ) {}

  async getOneWinIntegration(clientId: string): Promise<OneWinIntegration> {
    return this.oneWinRepository.findOne({ where: { clientId } });
  }

  async createOneWinIntegration(
    clientId: string,
    clientEmail: string,
  ): Promise<OneWinIntegration> {
    const integration = this.oneWinRepository.create({ clientId, clientEmail });
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

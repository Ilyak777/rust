import { Injectable, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { OnewinDto } from './dto/onewin.dto';
import { IntegrationRepository } from './integration.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IntegrationService {
  constructor(
    private readonly repo: IntegrationRepository,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async oneWinUpdate(value: string) {
    const integration = await this.repo.getOneWinIntegration(value);

    const result =
      integration === null
        ? await this.repo.createOneWinIntegration(value, '')
        : await this.repo.updateOneWinIntegration(integration.id, value);

    return result;
  }

  // async onewinWebhook(payload: OnewinDto) {
  //   const user = await this.userRepository.findOne({
  //     where: { id: payload.ok },
  //   });
  //   if (!user) {
  //     throw new BadRequestException('User not found');
  //   }
  //   const oneExists = await this.repo.getOneWinIntegration(payload.oci);
  //   if (oneExists) {
  //     throw new BadRequestException('onewin-already-exists');
  //   }
  //   return await this.repo.createOneWinIntegration(payload.oci, payload.oce);
  // }
}

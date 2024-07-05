import { Injectable, BadRequestException, CacheStore } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { OnewinDto } from './dto/onewin.dto';
import { IntegrationRepository } from './integration.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class IntegrationService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    private readonly repo: IntegrationRepository,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onewinLogin(userId: number): Promise<string> {
    const oauthKey = uuidv4();
    await this.cacheManager.set(`onewin-${oauthKey}`, userId, 300);

    const domain = '1wkkh.com?open=register&p=w3wf';
    const stringUrl = `https://${domain}&oauth_key=${oauthKey}&oauth_client=${process.env.ONEWIN_OAUTH_KEY}`;

    return stringUrl;
  }

  async onewinWebhook(payload: OnewinDto) {
    const userId = await this.cacheManager.get<number>(`onewin-${payload.ok}`);
    this.cacheManager.del(`onewin-${payload.ok}`);
    const oneExists = await this.repo.getOneWinIntegration(payload.oci);
    if (oneExists) {
      throw new BadRequestException('onewin-already-exists');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    // await this.commandsService.grantSkinbox(userId, user.steamId);
    return await this.checkOneWinIntegration(userId, payload.oci, payload.oce);
  }

  async checkOneWinIntegration(
    userId: number,
    clienId: string,
    clientEmail: string,
  ) {
    const integration = await this.repo.getOneWinIntegration(clienId);

    const result =
      integration === null
        ? await this.repo.createOneWinIntegration(userId, clienId, clientEmail)
        : await this.repo.updateOneWinIntegration(integration.id, clientEmail);

    return result;
  }
}

import { Injectable, BadRequestException, CacheStore } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { OnewinDto } from './dto/onewin.dto';
import { IntegrationRepository } from './integration.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CommandsService } from '../commands/commands.service';

@Injectable()
export class IntegrationService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    private readonly repo: IntegrationRepository,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private commandsService: CommandsService,
  ) {}

  async onewinLogin(userId: string) {
    const oauthKey = uuidv4();
    await this.cacheManager.set(`onewin-${oauthKey}`, userId, 300);

    let domain = '1wcght.life/casino/list?open=register&p=w3wf';

    return {
      url: `https://${domain}?oauth_key=${oauthKey}&oauth_client=${process.env.ONEWIN_OAUTH_KEY}`,
    };
  }

  async onewinWebhook(payload: OnewinDto) {
    const userId = (await this.cacheManager.get<string>(
      `onewin-${payload.ok}`,
    )) as string;
    this.cacheManager.del(`onewin-${payload.ok}`);
    const oneExists = await this.repo.getOneWinIntegration(payload.oci);
    if (oneExists) {
      throw new BadRequestException('onewin-already-exists');
    }
    await this.commandsService.checkAndGrantSkinbox(userId, 1, 2);
    return await this.repo.updateUserOneWinIntegration(userId);
  }

  async checkOneWinIntegration(value: string) {
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

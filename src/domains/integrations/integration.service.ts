import { Injectable, BadRequestException, CacheStore } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { OnewinDto } from './dto/onewin.dto';
import { IntegrationRepository } from './integration.repository';
import { v4 as uuidv4 } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CommandsService } from '../commands/commands.service';
import { UserService } from '../user/user.service';
import { ServersService } from '../servers/servers.service';

@Injectable()
export class IntegrationService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    private readonly repo: IntegrationRepository,
    private userService: UserService,
    private commandService: CommandsService,
    private serverService: ServersService,
  ) {}

  async onewinLogin(userId: number): Promise<string> {
    const oauthKey = uuidv4();
    await this.cacheManager.set(`onewin-${oauthKey}`, userId, 10000);

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
    const user = await this.userService.findById(userId);

    const skinboxCommandToSave = `o.grant user ${user.steamId} skinbox.nickname`;
    const vipCommandToSave = `addgroup ${user.steamId} vip 3d`;

    const servers = await this.serverService.findAllServers();
    const serversToGive = servers.filter((el) => {
      return el.id !== 5;
    });
    await serversToGive.map((el) => {
      this.serverService.executeStraightCommand(
        skinboxCommandToSave,
        el.id,
        user.steamId,
      );
      if (el.id === 3) {
        this.serverService.executeStraightCommand(
          vipCommandToSave,
          el.id,
          user.steamId,
        );
      }
    });

    return await this.checkOneWinIntegration(userId, payload.oci, payload.oce);
  }

  async checkOneWinIntegration(
    userId: number,
    clientId: string,
    clientEmail: string,
  ) {
    const integration = await this.repo.getOneWinIntegration(clientId);

    const result =
      integration === null
        ? await this.repo.createOneWinIntegration(userId, clientId, clientEmail)
        : await this.repo.updateOneWinIntegration(integration.id, clientEmail);

    return result;
  }
}

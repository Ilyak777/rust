import { ExecutionContext, Injectable } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';

@Injectable()
export class DynamicCacheKeyInterceptor extends CacheInterceptor {
  constructor(reflector: Reflector) {
    super('', reflector);
  }

  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const serverId = request.params.serverId;

    return `all_server_items_${serverId}`;
  }
}

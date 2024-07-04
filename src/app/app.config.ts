import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { CacheModuleAsyncOptions } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';

export interface IConfig {
  version: string;
  development: boolean;
  http: {
    host: string;
    port: number;
  };
}

function getPackageJsonVersion(): string {
  const packageJsonRaw = readFileSync(resolve('./package.json'), {
    encoding: 'utf-8',
  });
  const packageJson = JSON.parse(packageJsonRaw);
  return packageJson.version;
}

export default registerAs(
  'app',
  (): IConfig => ({
    version: getPackageJsonVersion(),
    development: process.env.ENV === 'development',
    http: {
      host: process.env.HTTP_HOST || 'localhost',
      port: parseInt(process.env.HTTP_PORT as string, 10) || 3000,
    },
  }),
);

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const store = await redisStore({
      socket: {
        host: configService.get<string>('REDIS_HOST'),
        port: parseInt(configService.get<string>('REDIS_PORT')!),
      },
    });
    return {
      store: () => store,
    };
  },
  inject: [ConfigService],
};

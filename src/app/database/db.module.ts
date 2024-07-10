import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

export const DatabaseModule = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => ({
    type: 'postgres',
    logging: config.get('ENV') === 'development' ? true : false,
    host: config.getOrThrow('DB_HOST'),
    port: config.getOrThrow('DB_PORT'),
    username: config.getOrThrow('DB_USER'),
    password: config.getOrThrow('DB_PASSWORD'),
    synchronize: true,
    autoLoadEntities: true,
    database: config.getOrThrow('DB_NAME'),
    entities: [join(__dirname, '../..', '/**/**/*.entity{.ts,.js}')],
  }),
});

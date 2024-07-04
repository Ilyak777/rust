import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';
import { SeederModule } from './seed.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['error'],
  });
  app.select(CommandModule).get(CommandService).exec();
  await app.close();
}
bootstrap();

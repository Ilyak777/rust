import { NestFactory } from '@nestjs/core';
import { RconModule } from './rcon.module';

async function bootstrap() {
  const app = await NestFactory.create(RconModule);
  await app.listen(4000);
}
bootstrap();

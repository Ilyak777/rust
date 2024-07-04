import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { SeederService } from './seed.service';

@Injectable()
export class SeederCommand {
  constructor(private readonly seederService: SeederService) {}

  @Command({
    command: 'seed:run',
    describe: 'Seed the database',
  })
  async seed() {
    await this.seederService.seed();
  }

  @Command({
    command: 'seed:clean',
    describe: 'Clean the database',
  })
  async clean() {
    await this.seederService.clean();
  }
}

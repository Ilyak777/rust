import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commands } from './entity/commands.entity';
import { UserModule } from '../user/user.module';
import { CommandsService } from './commands.service';
import { StatisticsModule } from '../statistics/statistics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Commands]), UserModule, StatisticsModule],
  providers: [CommandsService],
  controllers: [],
  exports: [CommandsService],
})
export class CommandsModule {}

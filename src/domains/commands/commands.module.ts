import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Commands } from './entity/commands.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Commands])],
  providers: [],
  controllers: [],
})
export class CommandsModule {}

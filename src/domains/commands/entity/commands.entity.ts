import { Server } from '../../servers/entity/server.entity';
import { User } from '../../user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CommandsTypeE } from '../enum/commands-type.enum';

@Entity()
export class Commands {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  command: string;

  @Column({ type: 'enum', enum: CommandsTypeE })
  type: CommandsTypeE;

  @ManyToOne(() => User, (user) => user.commands)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Server, (user) => user.command)
  @JoinColumn({ name: 'serverId' })
  server: Server;
}

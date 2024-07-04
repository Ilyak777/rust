import { Server } from 'src/domains/servers/entity/server.entity';
import { User } from 'src/domains/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Commands {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  command: string;

  @ManyToOne(() => User, (user) => user.commands)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Server, (server) => server.commands)
  server: Server;
}

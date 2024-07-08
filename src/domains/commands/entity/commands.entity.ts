import { Server } from '../../servers/entity/server.entity';
import { User } from '../../user/entities/user.entity';
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
}

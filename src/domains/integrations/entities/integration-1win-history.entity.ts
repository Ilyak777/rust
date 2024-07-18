import { User } from 'src/domains/user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class OneWinIntegrationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  clientId: string;

  @CreateDateColumn()
  createdAt: string;

  @ManyToOne(() => User, (user) => user.integrationsHistory)
  @JoinColumn({ name: 'userId' })
  user: User;
}

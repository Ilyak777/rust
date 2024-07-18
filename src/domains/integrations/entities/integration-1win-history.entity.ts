import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
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
}

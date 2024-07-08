import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class OneWinIntegration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: string;

  @Column()
  clientEmail: string;

  @CreateDateColumn()
  createdAt: string;
}

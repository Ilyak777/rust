import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Integration } from './integration.entity';

@Entity()
export class OneWinIntegration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: string;

  @Column()
  clientEmail: string;

  @OneToOne(() => Integration, (userIntegrations) => userIntegrations.onewin)
  Integrations: Integration;

  @Column()
  createdAt: string;
}

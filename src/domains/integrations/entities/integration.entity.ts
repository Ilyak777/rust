import { Entity, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { OneWinIntegration } from './integration-1win.entity';

@Entity()
export class Integration {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => OneWinIntegration, (onewin) => onewin.Integrations, {
    cascade: true,
  })
  onewin: OneWinIntegration[];
}

import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { OneWinIntegration } from './integration-1win.entity';
import { User } from 'src/domains/user/entities/user.entity';

@Entity()
export class Integration {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.integrations, {
    cascade: true,
  })
  @JoinColumn()
  user: User;

  @OneToOne(() => OneWinIntegration, (onewin) => onewin.Integrations, {
    cascade: true,
  })
  onewin: OneWinIntegration;
}

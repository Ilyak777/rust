import { User } from '../../user/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';

@Entity()
export class GameStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  shots: number;

  @Column({ default: 0 })
  hits: number;

  @Column({ default: 0 })
  accuracy: number;

  @Column({ default: 0 })
  kills: number;

  @Column({ default: 0 })
  deaths: number;

  @Column({ default: 0 })
  hours: number;

  @OneToOne(() => User, (user) => user.gameStats)
  user: User;
}

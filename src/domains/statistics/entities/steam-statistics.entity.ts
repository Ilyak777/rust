import { User } from '../../user/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';

@Entity()
export class SteamStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vacCount: number;

  @OneToOne(() => User, (user) => user.steamStats)
  user: User;
}

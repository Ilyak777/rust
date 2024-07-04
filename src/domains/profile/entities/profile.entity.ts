import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ProfileSocials } from './profile-socials.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class ProfileData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  tradeUrl: string;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @OneToOne(() => ProfileSocials, { cascade: true })
  @JoinColumn()
  socials: ProfileSocials;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { UserPurchasedItems } from './user-purchased-items.entity';
import { OrderHistory } from './user-order-history.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { UserRoleE } from '../enums/user-role.enum';
import { GameStats } from '../../statistics/entities/game-statistics.entity';
import { SteamStats } from '../../statistics/entities/steam-statistics.entity';
import { ProfileData } from '../../profile/entities/profile.entity';
import { Integration } from '../../integrations/entities/integration.entity';
import { Commands } from '../../commands/entity/commands.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ unique: true })
  steamId: string;

  @Column({ unique: true, nullable: true })
  internalId: string;

  @Column({ type: 'float', default: 0 })
  balance: number;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRoleE,
    default: UserRoleE.USER,
  })
  role: UserRoleE;

  @OneToOne(() => Integration, { cascade: true })
  @JoinColumn()
  integrations: Integration;

  @OneToMany(() => OrderHistory, (orderHistory) => orderHistory.user)
  orderHistory: OrderHistory[];

  @OneToOne(() => GameStats, { cascade: true })
  @JoinColumn()
  gameStats: GameStats;

  @OneToOne(() => SteamStats, { cascade: true })
  @JoinColumn()
  steamStats: SteamStats;

  @OneToOne(() => ProfileData)
  @JoinColumn()
  profileData: ProfileData;

  @OneToMany(() => UserPurchasedItems, (purchasedItems) => purchasedItems.user)
  purchasedItems: UserPurchasedItems[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  activeSubscriptions: Subscription[];

  @OneToMany(() => Commands, (command) => command.user)
  commands: Commands[];
}

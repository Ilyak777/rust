import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ShopItem } from '../../shop/entities/shop-item.entity';
import { Server } from '../../servers/entity/server.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.activeSubscriptions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ShopItem, (shopItem) => shopItem.subscriptions)
  @JoinColumn({ name: 'shopItemId' })
  subscriptions: ShopItem;

  @ManyToOne(() => Server, (server) => server.subscriptions)
  servers: Server[];

  @Column()
  expiredAt: Date;
}

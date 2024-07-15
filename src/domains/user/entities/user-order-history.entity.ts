import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ShopItem } from '../../shop/entities/shop-item.entity';

@Entity()
export class OrderHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.orderHistory)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ShopItem, (shopItem) => shopItem.orderHistories)
  @JoinColumn({ name: 'shopItemId' })
  purchases: ShopItem;

  @CreateDateColumn()
  createdAt: string;
}

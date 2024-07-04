import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ShopItem } from '../../shop/entities/shop-item.entity';

@Entity()
export class UserPurchasedItems {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.purchasedItems)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ShopItem, (shopItem) => shopItem.purchases)
  @JoinColumn({ name: 'shopItemId' })
  purchases: ShopItem;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ShopItemTypeE } from '../enums/shop-item.enum';
import { ShopItemSubtypeE } from '../enums/shop-item-subtype.enum';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { UserPurchasedItems } from '../../user/entities/user-purchased-items.entity';
import { OrderHistory } from '../../user/entities/user-order-history.entity';
import { Server } from '../../servers/entity/server.entity';
import { SetItems } from './set-items.entity';

@Entity()
export class ShopItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ShopItemTypeE,
  })
  type: ShopItemTypeE;

  @Column({
    type: 'enum',
    enum: ShopItemSubtypeE,
  })
  category: ShopItemSubtypeE;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'int' })
  price: number;

  @OneToMany(() => Subscription, (subscription) => subscription.subscriptions)
  subscriptions: Subscription[];

  @OneToMany(
    () => UserPurchasedItems,
    (purchasedItems) => purchasedItems.purchases,
  )
  purchases: UserPurchasedItems[];

  @OneToMany(() => OrderHistory, (orderHistory) => orderHistory.purchases)
  orderHistories: OrderHistory[];

  @ManyToOne(() => Server, (server) => server.shopItem)
  servers: Server[];

  @OneToOne(() => SetItems, { cascade: true })
  @JoinColumn()
  setItem: SetItems[];
}

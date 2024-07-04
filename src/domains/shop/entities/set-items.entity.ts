import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ShopItemSubtypeE } from '../enums/shop-item-subtype.enum';
import { ShopItem } from './shop-item.entity';

@Entity()
export class SetItems {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: [ShopItemSubtypeE],
  })
  category: ShopItemSubtypeE[];

  @Column({
    default: 0,
  })
  amount: number;
}

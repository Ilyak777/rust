import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ShopItemSubtypeE } from '../enums/shop-item-subtype.enum';

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

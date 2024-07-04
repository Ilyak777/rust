import { IsEnum, IsNumber } from 'class-validator';
import { ShopItemSubtypeE } from '../enums/shop-item-subtype.enum';

export class SetItemsDTO {
  @IsEnum(ShopItemSubtypeE)
  category: ShopItemSubtypeE[];

  @IsNumber()
  amount: number;
}

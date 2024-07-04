import {
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { ShopItemTypeE } from '../enums/shop-item.enum';
import { ShopItemSubtypeE } from '../enums/shop-item-subtype.enum';
import { SetItems } from '../entities/set-items.entity';
import { SetItemsDTO } from './set-items.dto';

export class CreateItemDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEnum(ShopItemTypeE)
  type: ShopItemTypeE;

  @IsNotEmpty()
  @IsEnum(ShopItemSubtypeE)
  category: ShopItemSubtypeE;

  @IsNotEmpty()
  @IsNumber()
  duration: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsArray()
  setItems: SetItemsDTO[];
}

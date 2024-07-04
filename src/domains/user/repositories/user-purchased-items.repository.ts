import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserPurchasedItems } from '../entities/user-purchased-items.entity';
import { ShopItemTypeE } from 'src/domains/shop/enums/shop-item.enum';

@Injectable()
export class UserPurchasedItemsRepository {
  constructor(
    @InjectRepository(UserPurchasedItems)
    private repo: Repository<UserPurchasedItems>,
  ) {}

  public async findAllUserItems(user: User): Promise<UserPurchasedItems[]> {
    return await this.repo.find({
      where: {
        user: { id: user.id },
        purchases: {
          type: In([
            ShopItemTypeE.SET,
            ShopItemTypeE.GENERAL,
            ShopItemTypeE.SUBSCRIPTION,
          ]),
        },
      },
      relations: ['purchases'],
    });
  }

  public async findUserItemsByCategory(
    user: User,
    category: ShopItemTypeE,
  ): Promise<UserPurchasedItems[]> {
    return await this.repo.find({
      where: {
        user: { id: user.id },
        purchases: {
          type: In([category]),
        },
      },
      relations: ['purchases'],
    });
  }
}

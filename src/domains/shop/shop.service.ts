import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ShopItem } from './entities/shop-item.entity';
import { User } from '../user/entities/user.entity';
import { UserPurchasedItems } from '../user/entities/user-purchased-items.entity';
import { OrderHistory } from '../user/entities/user-order-history.entity';
import { Cache } from '@nestjs/cache-manager';
import { CreateItemDTO } from './dto/create-item.input.dto';
import { ServersService } from '../servers/servers.service';
import { ShopItemTypeE } from './enums/shop-item.enum';
import { SetItems } from './entities/set-items.entity';
import { UserService } from '../user/user.service';
import { ShopItemSubtypeE } from './enums/shop-item-subtype.enum';
import { CommandsService } from '../commands/commands.service';

@Injectable()
export class ShopService {
  constructor(
    private commandService: CommandsService,
    private serversService: ServersService,
    private userService: UserService,
    @InjectRepository(ShopItem)
    private shopItemRepository: Repository<ShopItem>,
    @InjectRepository(SetItems)
    private setItemsRepository: Repository<SetItems>,
    @Inject(Cache) private cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {}

  async getAllActiveItems(): Promise<ShopItem[]> {
    const cacheKey = 'allActiveItems';
    const cached: ShopItem[] = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const items = await this.shopItemRepository.find();
    await this.cacheManager.set(cacheKey, items, 3600);
    return items;
  }

  async getItemById(itemId: number) {
    return await this.shopItemRepository.find({ where: { id: itemId } });
  }

  async getAllActiveItemsForServer(serverId: number): Promise<ShopItem[]> {
    const cacheKey = `all_server_items_${serverId}`;
    const cached: ShopItem[] = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const items = await this.shopItemRepository.find({
      where: { server: { id: serverId } },
    });
    await this.cacheManager.set(cacheKey, items, 3600);
    return items;
  }

  async purchaseItem(
    userId: number,
    shopItemIds: number[],
    serverId: number,
  ): Promise<any> {
    await this.dataSource.transaction(async (entityManager) => {
      const user = await entityManager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      for (let i = 0; i < shopItemIds.length; i++) {
        const shopItem = await entityManager.findOne(ShopItem, {
          where: { id: shopItemIds[i], server: { id: serverId } },
        });
        if (!shopItem) {
          throw new NotFoundException('Shop item not found');
        }

        if (user.balance < shopItem.price) {
          throw new BadRequestException('Insufficient balance');
        }

        user.balance -= shopItem.price;

        await entityManager.update(User, user.id, user);

        const purchase = entityManager.create(UserPurchasedItems, {
          user,
          purchases: shopItem,
        });
        await entityManager.save(purchase);

        const orderHistory = entityManager.create(OrderHistory, {
          user,
          purchases: shopItem,
        });
        const command = shopItem.command;
        await this.commandService.saveCommand(userId, serverId, command);

        await this.cacheManager.del(`all_server_items_${serverId}`);
        await entityManager.save(orderHistory);
      }
    });
    return {
      success: true,
    };
  }

  async createItems(
    createItemDTO: CreateItemDTO,
    serverId: number,
  ): Promise<void> {
    const { name, type, category, duration, price, setItems } = createItemDTO;

    const server = await this.serversService.findById(serverId)[0];
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (setItems && type !== ShopItemTypeE.SET) {
      throw new BadRequestException('Can not create set without items');
    }

    const shopItem = new ShopItem();
    shopItem.name = name;
    shopItem.type = type;
    shopItem.category = category;
    shopItem.isActive = true;
    shopItem.price = price;
    shopItem.server = server;

    if (type === ShopItemTypeE.SET) {
      const sets: SetItems[] = [];
      for (let i = 0; i < setItems.length; i++) {
        const setItem = new SetItems();
        setItem.category = setItems[i].category;
        setItem.amount = setItems[i].amount;
        sets.push(setItem);
      }
      shopItem.setItem = await this.setItemsRepository.save(sets);
    }

    await this.shopItemRepository.save(shopItem);
  }

  async addBalance(userId: number, amount: number): Promise<any> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.balance += amount;
    return this.userService.updateUser(user.id, user);
  }
}

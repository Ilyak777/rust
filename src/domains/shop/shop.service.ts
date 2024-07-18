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
          relations: ['server'],
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
    shopItem.duration = duration;
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

  async seedItems(): Promise<any> {
    // try {
    //   items.map((el) => {
    //     const Item = new ShopItem();
    //     const serverIds = JSON.parse(el.servers);

    //     Item.name = el.name_ru;
    //     Item.price = +el.price;
    //     Item.canBeGifted = el.can_gift === '1' ? true : false;
    //     Item.type =
    //       el.category_id === '19' ? ShopItemTypeE.SET : ShopItemTypeE.GENERAL;
    //     Item.category = this.getCategorySubtype(+el.category_id);

    //     if (serverIds === null) return;
    //     const nonNullable = serverIds.filter((el) => {
    //       el !== null;
    //     });
    //     if (nonNullable) {
    //       nonNullable.map(async (el: number) => {
    //         let serv = await this.serversService.findById(el)[0];

    //         if (!serv) {
    //           throw new NotFoundException('Server not found');
    //         }
    //         Item.server = serv;
    //         console.log(Item);

    //         this.shopItemRepository.save(Item);
    //       });
    //     }
    //   });
    // } catch (error) {
    //   console.log('--------->', error);
    // }
    return 'yes';
  }

  getCategorySubtype(categoryId: number): ShopItemSubtypeE | any {
    switch (categoryId) {
      case 1:
        return ShopItemSubtypeE.GUN;
      case 2:
        return ShopItemSubtypeE.CLOTHES;
      case 3:
        return ShopItemSubtypeE.RESOURCES;
      case 4:
        return ShopItemSubtypeE.SERVICES;
      case 7:
        return ShopItemSubtypeE.AMMO;
      case 8:
        return ShopItemSubtypeE.EXPLOSIVE;
      case 9:
        return ShopItemSubtypeE.TOOL;
      case 10:
        return ShopItemSubtypeE.ITEM;
      case 11:
        return ShopItemSubtypeE.COMPONENTS;
      case 12:
        return ShopItemSubtypeE.ELECTRICAL;
      case 13:
        return ShopItemSubtypeE.SKIN;
      case 15:
        return ShopItemSubtypeE.TEA;
      case 16:
        return ShopItemSubtypeE.CARD;
      case 17:
        return ShopItemSubtypeE.MEDS;
      case 18:
        return ShopItemSubtypeE.SKINS;
      case 20:
        return ShopItemSubtypeE.BLUEPRINT;
      default:
        throw new Error(`Unknown category ID: ${categoryId}`);
    }
  }

  getRealServerId(serverId: number): number {
    switch (serverId) {
      case null:
        break;
      case 1:
        return 4;
      case 2:
        return serverId;
      case 3:
        return serverId;
      case 4:
        return 5;
      default:
        throw new Error(`Unknown category ID: ${serverId}`);
    }
  }
}

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
    const data = [
      {
        id: '30',
        category_id: '3',
        servers: '["2", "3", "1"]',
        price: '45.00',
        amount: '500',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '1',
        status: '1',
        name: 'Cloth',
        short_name: 'Cloth',
        image: 'shop/tX7hykib16cFVR8NjgsiZ0D6Afmh0MgqNvTTGNRX.png',
      },
      {
        id: '41',
        category_id: '3',
        servers: '["2", "3", "1"]',
        price: '30.00',
        amount: '1000',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '1',
        status: '1',
        name: 'Wood',
        short_name: 'Wood',
        image: 'shop/Dy9dErD5AdzoOqOszOSQkk1k5J8OV4QcieueKt3L.png',
      },
      {
        id: '62',
        category_id: '3',
        servers: '["2", "3", "1"]',
        price: '90.00',
        amount: '100',
        command: '1',
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '3',
        status: '1',
        name: 'Scrap',
        short_name: 'Scrap',
        image: 'shop/tFEHyYg39YhHcfakaMnJgoS8wf9hAvGyM7N8WzIr.png',
      },
      {
        id: '92',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '250.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '12',
        status: '1',
        name: 'Assault Rifle',
        short_name: 'rifle.ak',
        image: 'shop/BPmLWzBQU0JwLbSGjAhHM7x2v4vAnonuLs2OTwpR.png',
      },
      {
        id: '95',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '200.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '12',
        status: '1',
        name: 'Bolt Action Rifle',
        short_name: 'rifle.bolt',
        image: 'shop/RuM8mTrx4xvFEcITy8HafKdaSparXSa93MYgNFwF.png',
      },
      {
        id: '97',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '20.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '1',
        status: '1',
        name: 'Compound Bow',
        short_name: 'bow.compound',
        image: 'shop/pRRFiBl8StNB70OLjABg3mljLqFaZ01iT0lBMk0N.png',
      },
      {
        id: '109',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '120.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '4',
        status: '1',
        name: 'Custom SMG',
        short_name: 'smg.2',
        image: 'shop/nHAQ7KJvdq1ctKGzJoLFKSxAO1O8i7zuzaS4ffd3.png',
      },
      {
        id: '110',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '60.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '1',
        status: '1',
        name: 'DB Shotgun',
        short_name: 'shotgun.double',
        image: 'shop/yTpkArrcYqeQV4nEdL4KMViEFBasHtREMJL2fOYp.png',
      },
      {
        id: '118',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '170.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '10',
        status: '1',
        name: 'LR-300',
        short_name: 'rifle.lr300',
        image: 'shop/DVhAUTROnIAVMjWU3NHWh2UYbHUKiKvgI2THcFUw.png',
      },
      {
        id: '119',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '450.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '18',
        status: '1',
        name: 'M249',
        short_name: 'lmg.m249',
        image: 'shop/s3SQtScL55YXs6YbXBNz6pDy8ld6jqnXpUKGmYM1.png',
      },
      {
        id: '120',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '50.00',
        amount: '5',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '1',
        status: '1',
        name: 'F1 Grenade',
        short_name: 'grenade.f1',
        image: 'shop/KF9VvLrL7uZAwibKpsIlp8U9O8HNuiecDuPusp9L.png',
      },
      {
        id: '121',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '30.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '1',
        status: '1',
        name: 'Shotgun',
        short_name: 'shotgun.waterpipe',
        image: 'shop/yfpqeOfMCgeYa17ROd6EWk9T0z2SBloTMinMdH8q.png',
      },
      {
        id: '122',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '300.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '18',
        status: '1',
        name: 'L96 Rifle',
        short_name: 'rifle.l96',
        image: 'shop/R0HsOUUF2Z95CD3LQKAsTf3jxok9gbHkfNBoaxVI.png',
      },
      {
        id: '126',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '130.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '4',
        status: '1',
        name: 'Thompson',
        short_name: 'smg.thompson',
        image: 'shop/QbIwMEAjJ29plaNbuzIlXxqfKtO9aeLo9T0IYnP9.png',
      },
      {
        id: '127',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '100.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '3',
        status: '1',
        name: 'M92 Pistol',
        short_name: 'pistol.m92',
        image: 'shop/RbHTOa7Bl9Dw3yLDXaZAu7FJ6PcD2oEtcj6l1bKh.png',
      },
      {
        id: '128',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '180.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '10',
        status: '1',
        name: 'M39 Rifle',
        short_name: 'rifle.m39',
        image: 'shop/XjdJQNaLH0XER71Xn66M5QhTG8Klp4wT6f3EBcZZ.png',
      },
      {
        id: '129',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '80.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '4',
        status: '1',
        name: 'Spas-12 Shotgun',
        short_name: 'shotgun.spas12',
        image: 'shop/ey2uIbeg6CsVK2MKpD5OW3H0BbVWADIHjeGZzN7o.png',
      },
      {
        id: '130',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '140.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '5',
        status: '1',
        name: 'MP5A4',
        short_name: 'smg.mp5',
        image: 'shop/9Mj6VDtKib2I5CNNqDpnVD3AB9HfiF8EInxwE78F.png',
      },
      {
        id: '131',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '180.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '5',
        status: '1',
        name: 'MG Launcher',
        short_name: 'multiplegrenadelauncher',
        image: 'shop/wmeUAKAFQkxzPUGcQBH4ymrZrieA8lMQ6VSYN1M3.png',
      },
      {
        id: '132',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '100.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '4',
        status: '1',
        name: 'Prototype 17',
        short_name: 'pistol.prototype17',
        image: 'shop/K7vXkZItIyI5xDenBMXcBFT5VzjqfbQxUTyN6RKf.png',
      },
      {
        id: '133',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '130.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '4',
        status: '1',
        name: 'SA Rifle',
        short_name: 'rifle.semiauto',
        image: 'shop/WmHAecYVugWxY6P0idf99WUqqLKgKAGtJhd8omBH.png',
      },
      {
        id: '134',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '80.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '3',
        status: '1',
        name: 'Pump Shotgun',
        short_name: 'shotgun.pump',
        image: 'shop/fznX11QU7AOebw7UIJcwjrwYUxE2r8kb5VBJqByE.png',
      },
      {
        id: '135',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '90.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '3',
        status: '1',
        name: 'SA Pistol',
        short_name: 'pistol.semiauto',
        image: 'shop/6QF8OrtwRxhXr5XfDDZ4nRnBM4X5VbyFGa4gFRzb.png',
      },
      {
        id: '136',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '100.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '3',
        status: '1',
        name: 'Python Revolver',
        short_name: 'pistol.python',
        image: 'shop/JAfJsiK45JuTEuzm0CvFs0oN2JjDHgWc9KZpfeRB.png',
      },
      {
        id: '137',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '75.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '2',
        status: '1',
        name: 'Revolver',
        short_name: 'pistol.revolver',
        image: 'shop/1aWinVcKU50KGsEKXCthvJiTkam5MGhCaPZzpe6D.png',
      },
      {
        id: '138',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '180.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '6',
        status: '1',
        name: 'Rocket Launcher',
        short_name: 'rocket.launcher',
        image: 'shop/sFESVriMNxCHBks8wabAyKGxrW4jUHInSDtfNKps.png',
      },
      {
        id: '145',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '30.00',
        amount: '5',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '1',
        status: '1',
        name: 'Flashbang',
        short_name: 'grenade.flashbang',
        image: 'shop/Q9GMfwcTLPQfO7V1geKd0tQOAPeEqUEi6R9MNiki.png',
      },
      {
        id: '206',
        category_id: '4',
        servers: '["2", "3", "1"]',
        price: '499.00',
        amount: '1',
        command: 'addgroup %steamid% elitepack %var%d',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'ELITEPACK',
        short_name: null,
        image: 'shop/2wklXX4FDhARrPM1umKuVsRVhyEqR6M7dtQO4Yr5.png',
      },
      {
        id: '241',
        category_id: '15',
        servers: '["2", "3", "1"]',
        price: '75.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '0',
        status: '1',
        name: 'Scrap Tea',
        short_name: 'scraptea.pure',
        image: 'shop/QJ6oxMnYNzkz184vZ2A8ObPm7ClpZzNOy1Rn1MPH.png',
      },
      {
        id: '251',
        category_id: '4',
        servers: '["2", "3", "1"]',
        price: '599.00',
        amount: '1',
        command: 'UI_RATECONF %steamid% amodulerate.x3 %var%',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Rate X3',
        short_name: null,
        image: 'shop/Z0jWpX840UaJ53yZQcQUZOn4BZDrDe6gD1Y4paBm.png',
      },
      {
        id: '253',
        category_id: '4',
        servers: '["2", "3", "1", "4"]',
        price: '299.00',
        amount: '1',
        command: 'addgroup %steamid% vip %var%d',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'VIP',
        short_name: null,
        image: 'shop/HWOKqdRVWU3M74nOZr0VClk1saYDfjQJAjnSihKN.png',
      },
      {
        id: '256',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.ak47.voodoo_dolls_ak47',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Voodoo Dolls',
        short_name: null,
        image: 'shop/yVOzt0T8FWzSCEGs81SBmkwNF0P6FWYCCzIFdjM4.png',
      },
      {
        id: '257',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.door.hinged.metal.school_locker_smd',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'School Locker',
        short_name: null,
        image: 'shop/PAwiCAHSMNozeUGEhZp7EUQTMI7ttb647XA5E15u.jpg',
      },
      {
        id: '258',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.door.hinged.metal.tugboat_smd',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Tugboat',
        short_name: null,
        image: 'shop/udVI5jhhZrgb6qEOLNewP4OFWzDGGnTmidF1U7qS.jpg',
      },
      {
        id: '259',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.door.hinged.metal.festive_bouquet_smd',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Festive Bouquet',
        short_name: null,
        image: 'shop/1FMr3sJnmmG6YbqYyIyKQYWhH5pl4wSSNBw5Gr8U.jpg',
      },
      {
        id: '260',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.door.hinged.metal.dots_smd',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Dots',
        short_name: null,
        image: 'shop/4zm3biSQvCVafLei0N5lZklZaNTS84zQDWZth0sc.jpg',
      },
      {
        id: '261',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.door.hinged.metal.gun_shop_smd',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Gun Shop',
        short_name: null,
        image: 'shop/DhEHqD9J0qv13oc2EUOhycSgaFCE8Iiykc9IZP9z.jpg',
      },
      {
        id: '262',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.door.hinged.metal.circus_smd',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Circus',
        short_name: null,
        image: 'shop/v9ns7gZbjx95Zi6BOxOifyNhL3iOdYRYVkGGt8VP.jpg',
      },
      {
        id: '263',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.door.hinged.metal.space_dino_smd',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Space Dino',
        short_name: null,
        image: 'shop/35PX2mlYvOUIBF4KblqfeLuNcmNAx8TKV3TJOOmi.jpg',
      },
      {
        id: '264',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.ak47.crazy_rabbit_ak47',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Easter Rabbit',
        short_name: null,
        image: 'shop/QaU7jOVy0IpXelaHGgH6BpBtHXSs3bz1zgTuG6sE.jpg',
      },
      {
        id: '265',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.ak47.taxi_beach_ak47',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Taxi to the beach',
        short_name: null,
        image: 'shop/3y0pI483dAhHyZoeDlVAa17YTCoMgWXroBnQUbxl.jpg',
      },
      {
        id: '266',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.ak47.hot_chili_ak47',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Hot Chili',
        short_name: null,
        image: 'shop/kdEWDOqb6GvfxPiZq7VcOrXewzijA56GFXeDn4fn.jpg',
      },
      {
        id: '267',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.ak47.prickly_roses_ak47',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Prickly Roses',
        short_name: null,
        image: 'shop/F8wO6aG7BWEm2fxH8aZUcg2xLED1owjzlAU7hn5B.jpg',
      },
      {
        id: '268',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.ak47.happy_easter_ak47',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Happy Easter',
        short_name: null,
        image: 'shop/qxfO1wvlTOOBXyUeVU5D3IkuA5Nl3a7urUiVXhun.jpg',
      },
      {
        id: '269',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.ak47.electro_shock_ak47',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Electro Shock',
        short_name: null,
        image: 'shop/ockmye4aCgDBCnqX9AWBKh46wcuM7RbzWI4EPeBo.jpg',
      },
      {
        id: '270',
        category_id: '18',
        servers: '["2", "3", "1"]',
        price: '99.00',
        amount: '1',
        command:
          'o.grant user %steamid% craftingpanel.skins_pack.ak47.jade_totem_ak47',
        is_blueprint: '0',
        is_command: '1',
        is_item: '0',
        can_gift: '1',
        wipe_block: null,
        status: '1',
        name: 'Jade Totem',
        short_name: null,
        image: 'shop/HaC33aohWwt5PlJ0JkvAxcg2ytvDWDGN4TWRYabm.jpg',
      },
      {
        id: '274',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '600.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '20',
        status: '1',
        name: 'Minigun',
        short_name: 'minigun',
        image: 'shop/ysJmizAtwfD9sYbWhqqrr9T8XJgwpHEIXO6plbWe.png',
      },
      {
        id: '276',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '20.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '0',
        status: '1',
        name: 'Crossbow',
        short_name: 'crossbow',
        image: 'shop/PrPoXGSnABaSHTzcl3Af6cQOGsWQCSIpeoogPEH0.png',
      },
      {
        id: '281',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '10.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '0',
        wipe_block: '0',
        status: '1',
        name: 'Pistol nailgun',
        short_name: 'pistol.nailgun',
        image: 'shop/hWfjUm4iBgCnGDh6zAOF8sL0q1TxhO07SXOaK9Qw.png',
      },
      {
        id: '285',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '200.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '5',
        status: '1',
        name: 'Flame Thrower',
        short_name: 'military flamethrower',
        image: 'shop/b3HDH4twttOC4k58z8MTH2kXtypyenDFfAEUwvvl.png',
      },
      {
        id: '286',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '80.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '4',
        status: '1',
        name: 'M4 Shotgun',
        short_name: 'shotgun.m4',
        image: 'shop/4dUNfZ3XjZHqFGUBeyE4GsEk9LIODYEUglyMBzzd.png',
      },
      {
        id: '287',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '100.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '4',
        status: '1',
        name: 'Flame Thrower',
        short_name: 'flamethrower',
        image: 'shop/jT8hAt249mi9AA2l434uWBlJyh0MAiG1TMyyYU0T.png',
      },
      {
        id: '288',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '5.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '0',
        status: '1',
        name: 'Hunting Bow',
        short_name: 'bow.hunting',
        image: 'shop/GZhp3dJ2C5elloKod74msqKvh7chkMnuOsZQk8Ue.png',
      },
      {
        id: '290',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '180.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '6',
        status: '1',
        name: 'HML',
        short_name: 'homingmissile.launcher',
        image: 'shop/bwRGn97T8WkaOe5uYh4KTk6eCQ7nwTowAFg6nGFR.png',
      },
      {
        id: '291',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '30.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '3',
        status: '1',
        name: 'Speargun',
        short_name: 'speargun',
        image: 'shop/A8GlETLSxDlvKFUCywN0WowLLWRAIdbqwCibbULn.png',
      },
      {
        id: '292',
        category_id: '1',
        servers: '["2", "3", "1"]',
        price: '5.00',
        amount: '1',
        command: null,
        is_blueprint: '0',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '0',
        status: '1',
        name: 'Eoka Pistol',
        short_name: 'pistol.eoka',
        image: 'shop/hlPX5YxySxrXrVYkEeHoOLBsWmWb5PePIIBf6FwI.png',
      },
      {
        id: '293',
        category_id: '20',
        servers: '["2", "3", "1"]',
        price: '250.00',
        amount: '1',
        command: null,
        is_blueprint: '1',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '0',
        status: '1',
        name: 'AK47',
        short_name: 'rifle.ak',
        image: 'shop/wkh8gjmI6mPFXQ6uOGzKVCY2KpqB7ZTvFHArnSyN.png',
      },
      {
        id: '294',
        category_id: '20',
        servers: '["2", "3", "1"]',
        price: '250.00',
        amount: '1',
        command: null,
        is_blueprint: '1',
        is_command: '0',
        is_item: '0',
        can_gift: '1',
        wipe_block: '0',
        status: '1',
        name: 'Bolt Action Rifle',
        short_name: 'rifle.bolt',
        image: 'shop/qlKd3AANVu7Yz2fE3Dh2eDIIz3BtTrETat5INXkO.png',
      },
    ];
    try {
      data.map((el) => {
        const Item = new ShopItem();
        const serverIds = JSON.parse(el.servers);

        Item.name = el.name;
        Item.price = +el.price;
        Item.canBeGifted = el.can_gift === '1' ? true : false;
        Item.type =
          el.category_id === '19' ? ShopItemTypeE.SET : ShopItemTypeE.GENERAL;
        Item.category = this.getCategorySubtype(+el.category_id);

        const servers = JSON.parse(el.servers);
        servers.map(async (el: number) => {
          const realId = await this.getRealServerId(el);
          let serv = await this.serversService.findById(realId)[0];

          if (!serv) {
            throw new NotFoundException('Server not found');
          }
          Item.server = serv;
          console.log(Item);

          this.shopItemRepository.save(Item);
        });
      });
    } catch (error) {
      console.log('--------->', error);
    }
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
        return 2;
      case 3:
        return 3;
      default:
        throw new Error(`Unknown category ID: ${serverId}`);
    }
  }
}

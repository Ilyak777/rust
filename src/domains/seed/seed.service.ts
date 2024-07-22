import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ShopItem } from '../shop/entities/shop-item.entity';
import { UserPurchasedItems } from '../user/entities/user-purchased-items.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { OrderHistory } from '../user/entities/user-order-history.entity';
import { GameStats } from '../statistics/entities/game-statistics.entity';
import { SteamStats } from '../statistics/entities/steam-statistics.entity';
import { ProfileData } from '../profile/entities/profile.entity';
import { UserRoleE } from '../user/enums/user-role.enum';
import { ShopItemTypeE } from '../shop/enums/shop-item.enum';
import { ShopItemSubtypeE } from '../shop/enums/shop-item-subtype.enum';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ShopItem)
    private shopItemRepository: Repository<ShopItem>,
    @InjectRepository(UserPurchasedItems)
    private userPurchasedItemsRepository: Repository<UserPurchasedItems>,
    @InjectRepository(Integration)
    private userIntegrationsRepository: Repository<Integration>,
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
    @InjectRepository(GameStats)
    private userGameStatsRepository: Repository<GameStats>,
    @InjectRepository(SteamStats)
    private userSteamStatsRepository: Repository<SteamStats>,
    @InjectRepository(ProfileData)
    private userProfileDataRepository: Repository<ProfileData>,
  ) {}

  async seed() {
    await this.seedUsers();
    // await this.seedShopItems();
    await this.seedUserPurchasedItems();
    await this.seedOrderHistory();
    await this.seedUserGameStats();
    await this.seedUserSteamStats();
    await this.seedUserProfileData();
  }

  async clean() {
    await this.cleanUserPurchasedItems();
    await this.cleanShopItems();
    await this.cleanUsers();
    await this.cleanUserIntegrations();
    await this.cleanOrderHistory();
    await this.cleanUserGameStats();
    await this.cleanUserSteamStats();
    await this.cleanUserProfileData();
  }

  async seedUsers() {
    const users = [
      this.userRepository.create({
        username: 'user1',
        internalId: 'user1_internal',
        steamId: 'user1_steam',
        balance: 100,
        role: UserRoleE.USER,
      }),
      this.userRepository.create({
        username: 'admin',
        internalId: 'admin_internal',
        steamId: 'admin_steam',
        balance: 500,
        role: UserRoleE.ADMIN,
      }),
    ];

    await this.userRepository.save(users);
  }

  // async seedShopItems() {
  //   const shopItems = [
  //     this.shopItemRepository.create({
  //       name: 'Set Item',
  //       type: ShopItemTypeE.SET,
  //       category: ShopItemSubtypeE.TOOL,
  //       duration: 3600,
  //       price: 10,
  //     }),
  //     this.shopItemRepository.create({
  //       name: 'General Item',
  //       type: ShopItemTypeE.GENERAL,
  //       category: ShopItemSubtypeE.GUN,
  //       duration: 7200,
  //       price: 20,
  //     }),
  //     this.shopItemRepository.create({
  //       name: 'Subscription Item',
  //       type: ShopItemTypeE.SUBSCRIPTION,
  //       category: ShopItemSubtypeE.RESOURCES,
  //       duration: 86400,
  //       price: 30,
  //     }),
  //   ];
  //   await this.shopItemRepository.save(shopItems);
  // }

  async seedUserPurchasedItems() {
    const user = await this.userRepository.findOne({
      where: { username: 'user1' },
    });
    const shopItems = await this.shopItemRepository.find();
    const userPurchasedItems = shopItems.map((item) =>
      this.userPurchasedItemsRepository.create({
        user,
        purchases: item,
      }),
    );
    await this.userPurchasedItemsRepository.save(userPurchasedItems);
  }

  // async seedUserIntegrations() {
  //   const user = await this.userRepository.findOne({
  //     where: { username: 'user1' },
  //   });
  //   const userIntegrations = this.userIntegrationsRepository.create({

  //     onewin: {
  //       clientId: 'onewin_client1',
  //       clientEmail: 'client1@onewin.com',
  //     },
  //   });
  //   user.integrations = userIntegrations;
  //   await this.userRepository.save(user);
  // }

  async seedOrderHistory() {
    const user = await this.userRepository.findOne({
      where: { username: 'user1' },
    });
    const shopItems = await this.shopItemRepository.find();
    const orderHistory = this.orderHistoryRepository.create({
      user,
      purchases: shopItems[0],
    });
    await this.orderHistoryRepository.save(orderHistory);
  }

  async seedUserGameStats() {
    const userGameStats = this.userGameStatsRepository.create({
      shots: 100,
      hits: 50,
      accuracy: 1,
      kills: 10,
      deaths: 5,
      hours: 100,
    });
    await this.userGameStatsRepository.save(userGameStats);
  }

  async seedUserSteamStats() {
    const userSteamStats = this.userSteamStatsRepository.create({
      vacCount: 0,
    });
    await this.userSteamStatsRepository.save(userSteamStats);
  }

  async seedUserProfileData() {
    const userProfileData = this.userProfileDataRepository.create({
      socials: {
        vk: 'https://vk.com/user1',
        youtube: 'https://youtube.com/user1',
        steam: 'https://steamcommunity.com/id/user1',
      },
      tradeUrl: 'https://steamcommunity.com/trade/user1',
      status: 'active',
    });
    await this.userProfileDataRepository.save(userProfileData);
  }

  async cleanUsers() {
    await this.userRepository.delete({});
  }

  async cleanShopItems() {
    await this.shopItemRepository.delete({});
  }

  async cleanUserPurchasedItems() {
    await this.userPurchasedItemsRepository.delete({});
  }

  async cleanUserIntegrations() {
    await this.userIntegrationsRepository.delete({});
  }

  async cleanOrderHistory() {
    await this.orderHistoryRepository.delete({});
  }

  async cleanUserGameStats() {
    await this.userGameStatsRepository.delete({});
  }

  async cleanUserSteamStats() {
    await this.userSteamStatsRepository.delete({});
  }

  async cleanUserProfileData() {
    await this.userProfileDataRepository.delete({});
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ShopItem } from '../shop/entities/shop-item.entity';
import { Subscription } from './entities/subscription.entity';
import { UserService } from '../user/user.service';
import { ShopService } from '../shop/shop.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private userService: UserService,
    @InjectRepository(Subscription)
    private userSubscriptionRepository: Repository<Subscription>,
  ) {}

  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.userSubscriptionRepository.find({
      relations: ['user', 'subscriptions'],
    });
  }

  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    const user = await this.userService.findByIdWithActiveSubscriptions(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.activeSubscriptions;
  }

  // async purchaseSubscription(
  //   userId: number,
  //   shopItemId: number,
  // ): Promise<Subscription> {
  //   const user = await this.userService.findById(userId);

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   // const shopItem = await this.shopService.getItemById(shopItemId)[0];

  //   if (!shopItem) {
  //     throw new NotFoundException('Shop item not found');
  //   }

  //   if (user.balance < shopItem.price) {
  //     throw new BadRequestException('Insufficient balance');
  //   }

  //   user.balance -= shopItem.price;
  //   await this.userService.createUser(user);

  //   const expiredAt = new Date();
  //   expiredAt.setSeconds(expiredAt.getSeconds() + shopItem.duration);

  //   const subscription = this.userSubscriptionRepository.create({
  //     user,
  //     subscriptions: shopItem,
  //     expiredAt,
  //   });

  //   return this.userSubscriptionRepository.save(subscription);
  // }

  async renewSubscription(
    userId: number,
    subscriptionId: number,
  ): Promise<Subscription> {
    const user = await this.userService.findByIdWithActiveSubscriptions(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id: subscriptionId, user },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const shopItem = subscription.subscriptions;

    if (user.balance < shopItem.price) {
      throw new BadRequestException('Insufficient balance');
    }

    user.balance -= shopItem.price;
    await this.userService.createUser(user);

    subscription.expiredAt.setSeconds(
      subscription.expiredAt.getSeconds() + shopItem.duration,
    );

    return this.userSubscriptionRepository.save(subscription);
  }

  async selectSubscription(
    userId: number,
    subscriptionId: number,
  ): Promise<Subscription> {
    const user = await this.userService.findByIdWithActiveSubscriptions(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id: subscriptionId, user },
      relations: ['subscriptions'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }
}

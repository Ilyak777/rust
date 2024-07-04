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

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ShopItem)
    private shopItemRepository: Repository<ShopItem>,
    @InjectRepository(Subscription)
    private userSubscriptionRepository: Repository<Subscription>,
  ) {}

  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.userSubscriptionRepository.find({
      relations: ['user', 'subscriptions'],
    });
  }

  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscriptions', 'activeSubscriptions.subscriptions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.activeSubscriptions;
  }

  async purchaseSubscription(
    userId: number,
    shopItemId: number,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const shopItem = await this.shopItemRepository.findOne({
      where: { id: shopItemId },
    });

    if (!shopItem) {
      throw new NotFoundException('Shop item not found');
    }

    if (user.balance < shopItem.price) {
      throw new BadRequestException('Insufficient balance');
    }

    user.balance -= shopItem.price;
    await this.userRepository.save(user);

    const expiredAt = new Date();
    expiredAt.setSeconds(expiredAt.getSeconds() + shopItem.duration);

    const subscription = this.userSubscriptionRepository.create({
      user,
      subscriptions: shopItem,
      expiredAt,
    });

    return this.userSubscriptionRepository.save(subscription);
  }

  async renewSubscription(
    userId: number,
    subscriptionId: number,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscriptions', 'activeSubscriptions.subscriptions'],
    });

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
    await this.userRepository.save(user);

    subscription.expiredAt.setSeconds(
      subscription.expiredAt.getSeconds() + shopItem.duration,
    );

    return this.userSubscriptionRepository.save(subscription);
  }

  async selectSubscription(
    userId: number,
    subscriptionId: number,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscriptions'],
    });

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

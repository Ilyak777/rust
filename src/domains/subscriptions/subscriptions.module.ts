import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionService } from './subscriptions.service';
import { UserModule } from '../user/user.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), UserModule, ShopModule],
  providers: [SubscriptionService],
  controllers: [SubscriptionsController],
})
export class SubscriptionModule {}

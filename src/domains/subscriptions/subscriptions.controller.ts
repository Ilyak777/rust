import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubscriptionService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionService) {}

  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'User subscriptions retrieved successfully.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('')
  getUserSubscriptions(@Req() req): Promise<Subscription[]> {
    const userId = req.user.userId;
    return this.service.getUserSubscriptions(userId);
  }

  // @ApiOperation({ summary: 'Purchase a subscription' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Subscription purchased successfully.',
  // })
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Post('/:shopItemId')
  // purchaseSubscription(
  //   @Req() req,
  //   @Param('shopItemId') shopItemId: number,
  // ): Promise<Subscription> {
  //   const userId = req.user.userId;
  //   return this.service.purchaseSubscription(userId, shopItemId);
  // }

  @ApiOperation({ summary: 'Renew a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully.',
  })
  @Patch(':userId/renew/:subscriptionId')
  renewSubscription(
    @Param('userId') userId: number,
    @Param('subscriptionId') subscriptionId: number,
  ): Promise<Subscription> {
    return this.service.renewSubscription(userId, subscriptionId);
  }

  @ApiOperation({ summary: 'Select a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription selected successfully.',
  })
  @Get(':userId/select/:subscriptionId')
  selectSubscription(
    @Param('userId') userId: number,
    @Param('subscriptionId') subscriptionId: number,
  ): Promise<Subscription> {
    return this.service.selectSubscription(userId, subscriptionId);
  }
}

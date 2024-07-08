import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  UseInterceptors,
  CacheTTL,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopItem } from './entities/shop-item.entity';
import { User } from '../user/entities/user.entity';
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';
import { DynamicCacheKeyInterceptor } from '../../common/interceptors/dynamic-cache.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/role.guard';
import { UserRoleE } from '../user/enums/user-role.enum';
import { CreateItemDTO } from './dto/create-item.input.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('shop')
@Controller('shop')
@UseInterceptors(CacheInterceptor)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @ApiOperation({ summary: 'Get all active shop items' })
  @ApiResponse({
    status: 200,
    description: 'All active shop items have been retrieved.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoleE.ADMIN, UserRoleE.MODERATOR, UserRoleE.OWNER)
  @Get('items')
  @CacheKey('all_active_items')
  @CacheTTL(100)
  getAllActiveItems(): Promise<ShopItem[]> {
    return this.shopService.getAllActiveItems();
  }

  @ApiOperation({ summary: 'Get all active shop items for a server' })
  @ApiResponse({
    status: 200,
    description: 'All active shop items for the server have been retrieved.',
  })
  @UseInterceptors(DynamicCacheKeyInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @CacheTTL(100)
  @Get('items/:serverId')
  getAllActiveItemsForServer(
    @Param('serverId') serverId: number,
  ): Promise<ShopItem[]> {
    return this.shopService.getAllActiveItemsForServer(serverId);
  }

  @ApiOperation({ summary: 'Create a new shop item' })
  @ApiResponse({ status: 201, description: 'The shop item has been created.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoleE.ADMIN, UserRoleE.OWNER)
  @Post('/create')
  createItem(
    @Param('serverId') serverId: number,
    @Body() items: CreateItemDTO,
  ): Promise<void> {
    return this.shopService.createItems(items, serverId);
  }

  @ApiOperation({ summary: 'Purchase a shop item' })
  @ApiResponse({
    status: 200,
    description: 'The shop item has been purchased.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('purchase/:shopItemId')
  purchaseItem(
    @Param('serverId') serverId: number,
    @Body() itemIds: number[],
    @Req() req,
  ): Promise<void> {
    const userId = req.user.userId;
    return this.shopService.purchaseItem(userId, itemIds, serverId);
  }

  @ApiOperation({ summary: 'Purchase a shop item' })
  @ApiResponse({
    status: 200,
    description: 'The shop item has been purchased.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('purchase/:shopItemId')
  deleteItem(
    @Param('serverId') serverId: number,
    @Body() itemIds: number[],
    @Req() req,
  ): Promise<void> {
    const userId = req.user.userId;
    return this.shopService.purchaseItem(userId, itemIds, serverId);
  }

  @ApiOperation({ summary: 'Add balance to a user account' })
  @ApiResponse({
    status: 200,
    description: 'Balance has been added to the user account.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('addBalance/:userId')
  addBalance(@Body('amount') amount: number, @Req() req): Promise<User> {
    const userId = req.user.userId;
    return this.shopService.addBalance(userId, amount);
  }
}

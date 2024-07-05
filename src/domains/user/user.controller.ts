import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UserPurchasedItems } from './entities/user-purchased-items.entity';
import { UserRoleE } from './enums/user-role.enum';
import { Roles, RolesGuard } from '../auth/guards/role.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully.',
  })
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    // const userId = req.user.userId;
    return this.userService.getMe(2);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUserById(@Param('id') id: number): Promise<User> {
    return this.userService.findById(id);
  }

  @ApiOperation({ summary: 'Get user by Steam ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('steam/:steamId')
  getUserBySteamId(@Param('steamId') steamId: string): Promise<User> {
    return this.userService.findBySteamId(steamId);
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
  })
  @ApiBearerAuth()
  @Get('profile')
  getProfile(@Req() req): Promise<User> {
    return this.userService.getUserProfile(req.user.userId);
  }

  @ApiOperation({ summary: 'Get purchased items for a user' })
  @ApiResponse({
    status: 200,
    description: 'User purchased items retrieved successfully.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/purchased-items')
  getUserPurchasedItems(@Req() req): Promise<UserPurchasedItems[]> {
    return this.userService.getUserPurchasedItems(req.user.userId);
  }

  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleE.ADMIN, UserRoleE.OWNER)
  @Patch(':userId/update-role')
  async changeUserRole(
    @Param('userId') userId: string,
    @Body('newRole') newRole: UserRoleE,
    @Body('requestOwnerId') requestOwnerId: string,
  ) {
    return this.userService.changeUserRole(requestOwnerId, userId, newRole);
  }
}

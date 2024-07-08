import { Controller, Patch, Body, UseGuards, Get, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileData } from './entities/profile.entity';
import { ProfileSocials } from './entities/profile-socials.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'The user profile has been retrieved.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/')
  getProfile(@Req() req): any {
    const userId = req.user.userId;
    return this.profileService.getProfile(userId);
  }

  @ApiOperation({ summary: 'Add or update trade URL' })
  @ApiResponse({ status: 200, description: 'Trade URL has been updated.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('/trade-url')
  addOrUpdateTradeUrl(
    @Req() req,
    @Body('tradeUrl') tradeUrl: string,
  ): Promise<ProfileData> {
    const userId = req.user.userId;
    return this.profileService.addOrUpdateTradeUrl(userId, tradeUrl);
  }

  @ApiOperation({ summary: 'Add or update social links' })
  @ApiResponse({ status: 200, description: 'Social links have been updated.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('/socials')
  addOrUpdateSocials(
    @Req() req,
    @Body() socialsData: Partial<ProfileSocials>,
  ): Promise<ProfileData> {
    const userId = req.user.userId;
    return this.profileService.addOrUpdateSocials(userId, socialsData);
  }
}

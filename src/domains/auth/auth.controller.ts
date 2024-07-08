import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { STEAM_AUTH_URL } from './constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Initiate Steam authentication' })
  @ApiResponse({
    status: 200,
    description: 'Successfully initiated Steam authentication.',
  })
  @Get('steam')
  @Redirect(STEAM_AUTH_URL, 302)
  async steamAuth(@Req() req) {}

  @ApiOperation({ summary: 'Handle Steam authentication return' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with Steam.',
  })
  @Get('steam/return')
  async steamAuthReturn(@Query() query: any, @Res() res) {
    try {
      const validationResponse = await this.authService.validateSteamResponse(
        query,
      );
      const isValid = validationResponse?.['openid']['is_valid'][0] === 'true';

      if (!isValid) {
        throw new BadRequestException('Invalid Steam login.');
      }

      const steamId = query['openid.identity'].split('/').pop();
      const user = {
        username: steamId,
        steamId: steamId,
      };

      const savedUser = await this.authService.validateAndSaveUser(user);
      await this.authService.updateUserStats(user);

      const accessToken = this.authService.generateAccessToken(savedUser);
      const refreshToken = this.authService.generateRefreshToken(savedUser);

      return res.redirect(
        `https://1w.rustresort.com/finish-auth?access_token=${accessToken}&refresh_token=${refreshToken}`,
      );
    } catch (error) {
      console.log(error);

      return res.send('Ne povezlo');
    }
  }
}

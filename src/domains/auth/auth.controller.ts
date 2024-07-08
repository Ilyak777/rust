import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Handle Steam authentication return' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with Steam.',
  })
  @Get('steam/return')
  async steamAuthReturn(@Query() query: any, @Res() res) {
    try {
      const userData = await this.authService.validateSteamResponse(query);

      if (!userData) {
        throw new BadRequestException('Invalid Steam login.');
      }

      const savedUser = await this.authService.validateAndSaveUser(userData);
      await this.authService.updateUserStats(userData);

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

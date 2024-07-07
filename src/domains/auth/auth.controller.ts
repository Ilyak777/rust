import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

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
  @UseGuards(AuthGuard('steam'))
  async steamAuth(@Req() req, @Res() res) {
    const urlParams = {
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': 'https://api-1w.rustresort.com/auth/steam/return',
      'openid.realm': 'http://localhost:3001/finish-auth',
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    }

    const url = 'https://steamcommunity.com/openid/login?' + (new URLSearchParams(urlParams)).toString();

    return res.redirect(url);
  }

  @ApiOperation({ summary: 'Handle Steam authentication return' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to the frontend with access and refresh tokens.',
  })
  @ApiBearerAuth()
  @Get('steam/return')
  @UseGuards(AuthGuard('steam'))
  async steamAuthRedirect(@Req() req, @Res() res) {
    const reqUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    console.log('REQUEST URL');
    console.log(reqUrl);
    const user = req.user;
    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    console.log('Redirecting user');

    return res.redirect(
      `http://localhost:3001/finish-auth?access_token=${accessToken}&refresh_token=${refreshToken}`,
    );
  }
}

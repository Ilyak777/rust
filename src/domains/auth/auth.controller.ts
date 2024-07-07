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
  async steamAuth(@Req() req) {}

  @ApiOperation({ summary: 'Handle Steam authentication return' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to the frontend with access and refresh tokens.',
  })
  @ApiBearerAuth()
  @Get('steam/return')
  @UseGuards(AuthGuard('steam'))
  async steamAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;
    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    return res.redirect(
      `/?access_token=${accessToken}&refresh_token=${refreshToken}`,
    );
  }
}

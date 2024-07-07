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
    console.log('Getting user');
    const user = req.user;
    console.log('Generating tokens');
    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    console.log('Redirecting user');

    return res.redirect(
      `http://localhost:3001/finish-auth?access_token=${accessToken}&refresh_token=${refreshToken}`,
    );
  }
}

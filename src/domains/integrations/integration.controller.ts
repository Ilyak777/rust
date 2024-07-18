import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OnewinDto } from './dto/onewin.dto';
import { IntegrationService } from './integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('1win')
export class IntegrationController {
  constructor(private readonly service: IntegrationService) {}

  @Get('login')
  @UseGuards(JwtAuthGuard)
  async onewinLogin(@Req() req: Request) {
    return this.service.onewinLogin(Number(req['user'].userId));
  }

  @Get('callback')
  @HttpCode(200)
  async onewinWebhook(@Query() query: OnewinDto) {
    console.info('checking 1win callback');

    await this.service.onewinWebhook(query);
    return true;
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async onewinLogout(@Req() req) {
    const userId = req.user.userId;
    await this.service.onewinLogout(userId);
    return true;
  }
}

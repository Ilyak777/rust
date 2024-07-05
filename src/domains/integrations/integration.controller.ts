import {
  Controller,
  Get,
  HttpCode,
  Query,
  Redirect,
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
  @Redirect('https://1w.rustresort.com')
  async onewinLogin(@Req() req: Request) {
    return this.service.onewinLogin(Number(req['user'].userId));
  }

  @Get('callback')
  @HttpCode(200)
  async onewinWebhook(@Query() query: OnewinDto) {
    await this.service.onewinWebhook(query);
    return true;
  }
}

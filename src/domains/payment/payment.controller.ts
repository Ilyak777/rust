import { Controller, UseGuards, Get, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: '' })
  @ApiResponse({
    status: 200,
    description: '',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/')
  getProfile(@Req() req): any {
    const userId = req.user.userId;
  }
}

// import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
// import { OnewinDto } from './dto/onewin.dto';
// import { IntegrationService } from './integration.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// @Controller('1win')
// export class IntegrationController {
//   constructor(private readonly service: IntegrationService) {}

//   @Get('login')
//   @UseGuards(JwtAuthGuard)
//   async onewinLogin(@Req() req: Request) {
//     return this.service.onewinLogin(req['user'].userId);
//   }
// }

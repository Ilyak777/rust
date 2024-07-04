import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('healthz')
export class HealthController {
  constructor() {}

  @ApiOperation({ summary: 'Check the health of the application' })
  @ApiResponse({ status: 200, description: 'The application is healthy.' })
  @Get()
  check() {
    return { good: 'job' };
  }
}

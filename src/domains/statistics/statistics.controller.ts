import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { SteamStats } from './entities/steam-statistics.entity';
import { GameStats } from './entities/game-statistics.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiOperation({ summary: 'Get Steam statistics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Steam statistics retrieved successfully.',
  })
  @Get(':userId/steam')
  getSteamStats(@Param('userId') userId: number): Promise<SteamStats> {
    return this.statisticsService.getSteamStats(userId);
  }

  @ApiOperation({ summary: 'Get game statistics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Game statistics retrieved successfully.',
  })
  @Get(':userId/game')
  getGameStats(@Param('userId') userId: number): Promise<GameStats> {
    return this.statisticsService.getGameStats(userId);
  }

  @ApiOperation({ summary: 'Update Steam statistics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Steam statistics updated successfully.',
  })
  @Patch(':userId/steam')
  updateSteamStats(
    @Param('userId') userId: number,
    @Body() steamStatsData: Partial<SteamStats>,
  ): Promise<SteamStats> {
    return this.statisticsService.updateSteamStats(userId, steamStatsData);
  }

  @ApiOperation({ summary: 'Update game statistics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Game statistics updated successfully.',
  })
  @Patch(':userId/game')
  updateGameStats(
    @Param('userId') userId: number,
    @Body() gameStatsData: Partial<GameStats>,
  ): Promise<GameStats> {
    return this.statisticsService.updateGameStats(userId, gameStatsData);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SteamStats } from './entities/steam-statistics.entity';
import { GameStats } from './entities/game-statistics.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(SteamStats)
    private steamStatsRepository: Repository<SteamStats>,
    @InjectRepository(GameStats)
    private gameStatsRepository: Repository<GameStats>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getSteamStats(userId: number): Promise<SteamStats> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['steamStats'],
    });
    if (!user || !user.steamStats) {
      throw new NotFoundException('Steam stats not found');
    }
    return user.steamStats;
  }

  async getGameStats(userId: number): Promise<GameStats> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['gameStats'],
    });
    if (!user || !user.gameStats) {
      throw new NotFoundException('Game stats not found');
    }
    return user.gameStats;
  }

  async getAllStats(userId: number): Promise<GameStats> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['gameStats'],
    });
    if (!user || !user.gameStats) {
      throw new NotFoundException('Game stats not found');
    }
    return user.gameStats;
  }

  async updateSteamStats(
    userId: number,
    steamStatsData: Partial<SteamStats>,
  ): Promise<SteamStats> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['steamStats'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let steamStats = user.steamStats;
    if (!steamStats) {
      steamStats = this.steamStatsRepository.create(steamStatsData);
      steamStats.user = user;
    } else {
      steamStats = { ...steamStats, ...steamStatsData };
    }

    return this.steamStatsRepository.save(steamStats);
  }

  async updateGameStats(
    userId: number,
    gameStatsData: Partial<GameStats>,
  ): Promise<GameStats> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['gameStats'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let gameStats = user.gameStats;
    if (!gameStats) {
      gameStats = this.gameStatsRepository.create(gameStatsData);
      gameStats.user = user;
    } else {
      gameStats = { ...gameStats, ...gameStatsData };
    }

    return this.gameStatsRepository.save(gameStats);
  }
}

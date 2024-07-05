import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  generateAccessToken(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    const x = this.jwtService.sign(payload);

    return x;
  }

  generateRefreshToken(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  updateUserStats(user) {
    return this.userService.updateUserStatistics(user);
  }

  async validateAndSaveUser(user: any): Promise<User> {
    let existingUser = await this.userService.findBySteamId(user.steamId);

    if (existingUser) {
      existingUser.username = user.username;
      existingUser.avatar = user.avatar;
    } else {
      existingUser = this.userService.createUser(user)[0];
    }

    return existingUser;
  }

  async validateUser(userId: string): Promise<User> {
    return this.userService.findBySteamId(userId);
  }
}

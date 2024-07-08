import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-steam';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class SteamStrategy extends PassportStrategy(Strategy, 'steam') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      returnURL: `https://api-1w.rustresort.com/auth/steam/return`,
      // realm: configService.get('FRONTEND_URL'),
      realm: `https://rustresort.com/`,
      apiKey: configService.get('STEAM_API_KEY'),
    });
  }

  async validate(identifier: string, profile: any, done: Function) {
    if (!profile) {
      return done(new UnauthorizedException(), false);
    }

    const user = {
      username: profile.displayName,
      steamId: profile.id,
    };

    try {
      const savedUser = await this.authService.validateAndSaveUser(user);
      await this.authService.updateUserStats(user);
      done(null, savedUser);
    } catch (error) {
      done(error, false);
    }
  }
}

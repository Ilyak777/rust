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
      realm: `https://api-1w.rustresort.com/`,
      apiKey: configService.get('STEAM_API_KEY'),
    });
  }

  async validate(identifier: string, profile: any, done: Function) {
    console.log('Started');
    if (!profile) {
      return done(new UnauthorizedException(), false);
    }

    console.log('Unauthorized skipped');
    const user = {
      username: profile.displayName,
      steamId: profile.id,
    };

    console.log('Got user');
    try {
      const savedUser = await this.authService.validateAndSaveUser(user);
      await this.authService.updateUserStats(user);
      console.log('SUCCESS');
      done(null, savedUser);
    } catch (error) {
      console.log('ERROR');
      done(error, false);
    }
  }
}

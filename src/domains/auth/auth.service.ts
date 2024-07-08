import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parseString, parseStringPromise } from 'xml2js';
import { returnTo } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async validateSteamResponse(query: any): Promise<any> {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'check_authentication',
      'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
      'openid.identity': query['openid.identity'],
      'openid.claimed_id': query['openid.claimed_id'],
      'openid.return_to': returnTo,
      'openid.response_nonce': query['openid.response_nonce'],
      'openid.assoc_handle': query['openid.assoc_handle'],
      'openid.signed': query['openid.signed'],
      'openid.sig': query['openid.sig'],
    });

    const response = await axios.post(
      `https://steamcommunity.com/openid/login?` + params.toString(),
    );

    if (!response.data.includes('is_valid:true')) {
      return false;
    }

    const steamid64 = query['openid.claimed_id'].split('/').at(-1);

    const profileData = (await axios.request({
      baseURL: 'https://steamcommunity.com/profiles/',
      url: `${steamid64}?xml=1`,
      method: 'GET',
    })).data.profile;

    const parsedProfile = await parseStringPromise(profileData);

    return {
      steamId: parsedProfile.steamID64[0],
      avatar: parsedProfile.avatarFull ? parsedProfile.avatarFull[0] : '',
      username: parsedProfile.steamID[0]
    };
  }

  generateAccessToken(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return this.jwtService.sign(payload);
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

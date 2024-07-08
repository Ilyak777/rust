import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parseString } from 'xml2js';

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
      'openid.claimed_id': query['openid.claimed_id'],
      'openid.identity': query['openid.identity'],
      'openid.return_to': this.configService.get('RETURN_TO'),
      'openid.response_nonce': query['openid.response_nonce'],
      'openid.assoc_handle': query['openid.assoc_handle'],
      'openid.signed': query['openid.signed'],
      'openid.sig': query['openid.sig'],
      'openid.realm': this.configService.get('REALM'),
    });

    const response = await axios.post(
      `https://steamcommunity.com/openid/login?` + params.toString(),
    );

    const result = await new Promise((resolve, reject) => {
      parseString(response.data, (err, parsedResult) => {
        if (err) return reject(err);
        resolve(parsedResult);
      });
    });

    return result;
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

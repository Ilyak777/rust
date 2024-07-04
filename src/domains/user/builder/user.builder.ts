import { BaseEntityBuilder } from 'src/common/builder/base.builder';
import { User } from '../entities/user.entity';

export class UserBuilder extends BaseEntityBuilder<User> {
  constructor() {
    super();
    this.entity = new User();
  }

  public username(username: string): UserBuilder {
    this.entity.username = username;

    return this;
  }

  public steamId(steamId: string): UserBuilder {
    this.entity.steamId = steamId;

    return this;
  }

  public balance(balance: number): UserBuilder {
    this.entity.balance = balance;

    return this;
  }

  public steamStats(steamStats: any): UserBuilder {
    this.entity.steamStats = steamStats;

    return this;
  }

  public vacCount(vacCount: number): UserBuilder {
    this.entity.steamStats.vacCount = vacCount;

    return this;
  }

  public hours(hours: number): UserBuilder {
    this.entity.gameStats.hours = hours;

    return this;
  }
}

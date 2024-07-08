import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileSocials } from './entities/profile-socials.entity';
import { ProfileData } from './entities/profile.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileData)
    private profileRepository: Repository<ProfileData>,
    @InjectRepository(ProfileSocials)
    private socialsRepository: Repository<ProfileSocials>,
    private userService: UserService,
  ) {}

  async addOrUpdateTradeUrl(
    userId: number,
    tradeUrl: string,
  ): Promise<ProfileData> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profileData = user.profileData;
    if (!profileData) {
      profileData = this.profileRepository.create({ tradeUrl });
    } else {
      profileData.tradeUrl = tradeUrl;
    }

    return this.profileRepository.save(profileData);
  }

  async getAll(): Promise<ProfileSocials[]> {
    return await this.socialsRepository.find();
  }

  async getProfile(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user[0].profileData) {
      return {};
    } else {
      return user[0].profileData;
    }
  }

  async addOrUpdateSocials(
    userId: number,
    socialsData: Partial<ProfileSocials>,
  ): Promise<ProfileData> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profileData = user.profileData;
    if (!profileData) {
      profileData = this.profileRepository.create();
      profileData.socials = this.socialsRepository.create(socialsData);
    } else if (!profileData.socials) {
      profileData.socials = this.socialsRepository.create(socialsData);
    } else {
      profileData.socials = { ...profileData.socials, ...socialsData };
    }

    await this.socialsRepository.save(profileData.socials);
    return this.profileRepository.save(profileData);
  }
}

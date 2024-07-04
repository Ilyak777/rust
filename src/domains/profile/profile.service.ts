import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ProfileSocials } from './entities/profile-socials.entity';
import { ProfileData } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileData)
    private profileRepository: Repository<ProfileData>,
    @InjectRepository(ProfileSocials)
    private socialsRepository: Repository<ProfileSocials>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async addOrUpdateTradeUrl(
    userId: number,
    tradeUrl: string,
  ): Promise<ProfileData> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profileData'],
    });
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
    const user = await this.userRepository.find({
      where: { id: userId },
      relations: ['profileData', 'profileData.socials'],
    });
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profileData', 'profileData.socials'],
    });
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

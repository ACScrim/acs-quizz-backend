import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByDiscordId(discordId: string) {
    return this.userModel.findOne({ discordId });
  }

  async createOrUpdateFromDiscord(
    profile: any,
    accessToken: string,
    refreshToken: string,
  ) {
    return this.userModel.findOneAndUpdate(
      { discordId: profile.id },
      {
        username: profile.username ?? profile.global_name, // Mettre global_name ou username ?
        avatar: profile.avatar,
        discordAccessToken: accessToken,
        discordRefreshToken: refreshToken,
      },
      { upsert: true, new: true },
    );
  }

  async updateDiscordTokens(
    discordId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
  ) {
    return this.userModel.findOneAndUpdate(
      { discordId },
      {
        discordAccessToken: accessToken,
        discordRefreshToken: refreshToken,
        expiresAt,
      },
      { new: true },
    );
  }

  async updateTokens(
    discordId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    return this.userModel.findOneAndUpdate(
      { discordId },
      {
        accessToken,
        refreshToken
      },
      { new: true },
    );
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    return this.userModel.findByIdAndUpdate(userId, { discordRefreshToken: refreshToken });
  }

  async findByRefreshToken(refreshToken: string) {
    return this.userModel.findOne({ discordRefreshToken: refreshToken });
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }
}

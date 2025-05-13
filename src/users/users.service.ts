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

  async createOrUpdateFromDiscord(profile: any, accessToken: string, refreshToken: string) {
    return this.userModel.findOneAndUpdate(
      { discordId: profile.id },
      {
        username: profile.username, // Mettre global_name ou username ?
        avatar: profile.avatar, // Ecrire l'url
        accessToken,
        refreshToken,
      },
      { upsert: true, new: true }
    );
  }

  async updateTokens(discordId: string, accessToken: string, refreshToken: string, expiresAt: Date) {
    return this.userModel.findOneAndUpdate(
      { discordId },
      {
        accessToken,
        refreshToken,
        expiresAt,
      },
      { new: true }
    );
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }
}
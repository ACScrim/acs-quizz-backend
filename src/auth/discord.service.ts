import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DiscordService {
  async getProfile(discordAccessToken: string) {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${discordAccessToken}` },
    });
    return response.data;
  }
}
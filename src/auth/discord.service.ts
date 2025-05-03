import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DiscordService {
  async getProfile(accessToken: string) {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }
}
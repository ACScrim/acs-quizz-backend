import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    if (
      !configService.get<string>('DISCORD_CLIENT_ID') ||
      !configService.get<string>('DISCORD_CLIENT_SECRET')
    ) {
      throw new Error('Discord client ID/secret not set');
    }
    super({
      clientID:
        configService.get<string>('DISCORD_CLIENT_ID') || 'DISCORD_CLIENT_ID',
      clientSecret:
        configService.get<string>('DISCORD_CLIENT_SECRET') || 'DISCORD_SECRET',
      callbackURL:
        configService.get<string>('DISCORD_CALLBACK_URL') ||
        'http://localhost:3000/api/auth/discord/redirect',
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    console.log(accessToken, refreshToken, profile);
    // Ici tu peux gérer la création ou récupération de l'utilisateur
    const user = await this.usersService.createOrUpdateFromDiscord(profile, accessToken, refreshToken);
    done(null, user);
  }
}

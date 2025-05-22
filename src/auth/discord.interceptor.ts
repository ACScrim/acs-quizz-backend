import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from 'src/users/users.service';
import axios from 'axios';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class DiscordRefreshInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    if (user && user.discordRefreshToken) {
      // Vérifie si le token Discord est expiré (à adapter selon ton modèle)
      const isExpired = !user.expiresAt || new Date(user.expiresAt) < new Date();
      if (isExpired) {
        // Rafraîchit le token Discord
        const params = new URLSearchParams();
        params.append('client_id', process.env.DISCORD_CLIENT_ID!);
        params.append('client_secret', process.env.DISCORD_CLIENT_SECRET!);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', user.discordRefreshToken);
        params.append('redirect_uri', process.env.DISCORD_CALLBACK_URL!);
        params.append('scope', 'identify email');

        const response = await axios.post(
          'https://discord.com/api/oauth2/token',
          params,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        );

        const expiresAt = new Date(
          Date.now() + response.data.expires_in * 1000,
        );
        // Mets à jour l'utilisateur en base
        await this.usersService.updateDiscordTokens(
          user.discordId,
          response.data.access_token,
          response.data.refresh_token,
          expiresAt
        );
        // Mets à jour le user dans la requête
        request.user.accessToken = response.data.access_token;
        request.user.refreshToken = response.data.refresh_token;
      }
    }
    return next.handle();
  }
}

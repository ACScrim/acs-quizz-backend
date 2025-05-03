import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { DiscordService } from './discord.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly discordService: DiscordService
  ) {}

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  async discordLogin() {}

  @Get('discord/redirect')
  @UseGuards(AuthGuard('discord'))
  discordLoginCallback(@Req() req) {
    // req.user contient l'utilisateur
    const user = req.user;
    // Génère un JWT
    const payload = {
      sub: user._id,
      discordId: user.discordId,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);
    // Retourne le token (ou redirige avec le token en query)
    return { access_token: token, user };
  }

  @Post('discord/external-login')
  async externalLogin(@Body() body) {
    const { accessToken, refreshToken } = body;
    // Appelle l’API Discord pour récupérer le profil utilisateur
    const profile = await this.discordService.getProfile(accessToken);
    // Crée ou met à jour l’utilisateur dans ta base
    const user = await this.usersService.createOrUpdateFromDiscord(
      profile,
      accessToken,
      refreshToken,
    );
    // Génère un JWT pour ton API
    const payload = {
      sub: user._id,
      discordId: user.discordId,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);
    return { access_token: token, user };
  }
}

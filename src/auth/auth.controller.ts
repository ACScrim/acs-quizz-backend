import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { DiscordService } from './discord.service';
import { randomBytes } from 'crypto';
import { User } from 'src/users/entities/user.entity';

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
  async discordLoginCallback(@Req() req, @Res() res) {
    // req.user contient l'utilisateur
    const user = req.user;
    // Génère un JWT
    const payload = {
      sub: user._id,
      discordId: user.discordId,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);
    
    // Génère un refresh token sécurisé
    const refreshToken = randomBytes(64).toString('hex');
    await this.usersService.updateTokens(
      user.discordId,
      token,
      refreshToken
    );

    const updatedUser = await this.usersService.findByDiscordId(user.discordId);
    
    // Retourne le token (ou redirige avec le token en query)
    return res.redirect(`http://localhost:5173/discord-callback?user=${JSON.stringify(updatedUser)}`);
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
    ) as User;
    // Génère un JWT pour ton API
    const payload = {
      sub: user._id,
      discordId: user.discordId,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);

    // Génère un refresh token sécurisé
    const newRefreshToken = randomBytes(64).toString('hex');
    await this.usersService.updateTokens(user.discordId, token, newRefreshToken);

    return user;
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    // Recherche l'utilisateur par refresh token
    const user = await this.usersService.findByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Génère un nouveau JWT et un nouveau refresh token
    const payload = {
      sub: user._id,
      discordId: user.discordId,
      username: user.username,
    };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = randomBytes(64).toString('hex');
    await this.usersService.updateTokens(user.discordId, accessToken, newRefreshToken);

    return user;
  }
}

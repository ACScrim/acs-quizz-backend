import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
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
}

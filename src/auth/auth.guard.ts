import { AuthGuard } from '@nestjs/passport';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}


@Injectable()
export class JwtWsGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Attache l'utilisateur au client pour l'utiliser plus tard
      (client as any).user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Exemple : le token est passé en query string ?token=xxx
    // return client.handshake.query?.token as string || null;
    // Ou dans les headers : 
    // return client.handshake.headers['authorization']?.split(' ')[1] || null;
    // Ou dans auth:
    return client.handshake.auth?.token || null;
  }
}
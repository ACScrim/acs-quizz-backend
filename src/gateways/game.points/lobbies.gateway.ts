import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtWsGuard } from 'src/auth/auth.guard';
import { CreateLobbyDto } from 'src/lobbies/dto/create-lobby.dto';
import { LobbiesService } from 'src/lobbies/lobbies.service';

@WebSocketGateway({
  namespace: 'lobbies',
  cors: {
    origin: '*',
  },
})
@UseGuards(JwtWsGuard)
export class LobbiesGateway {
  constructor(private readonly lobbiesService: LobbiesService) {}

  @SubscribeMessage('lobby:create')
  async handleCreateLobby(client: Socket, payload: CreateLobbyDto) {
    try {
      const user = (client as any).user;
      if (!user) {
        console.error('User not found on socket');
        client.emit('error', { message: 'User not authenticated' });
        return;
      }
      const lobby = await this.lobbiesService.create(payload, user.sub);
      client.join(lobby.id);
      console.log('Lobby created:', lobby.id, client.rooms);
      client.emit('lobby-created', lobby);
    } catch (error) {
      console.error('Error in create-lobby:', error);
      client.emit('error', {
        message: 'Internal server error',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('lobby:join')
  handleMessage(client: Socket, lobbyId: string) {
    if (client.rooms.size > 0) return; // Si le client est déjà dans une salle, on ne le laisse pas rejoindre une autre
    client.join(lobbyId);
    client.emit('joined-lobby', lobbyId);
  }

  @SubscribeMessage('lobby:leave')
  async handleMessageLobby(client: Socket, lobbyId: string) {
    console.log('Leaving lobby:', lobbyId, client.rooms);
    if (client.rooms.has(lobbyId)) {
      client.leave(lobbyId);
      const user = (client as any).user;
      await this.lobbiesService.leave(user.sub, lobbyId);
      client.to(lobbyId).emit('user-left', user);
      client.emit('left-lobby', lobbyId);
    }
  }
}

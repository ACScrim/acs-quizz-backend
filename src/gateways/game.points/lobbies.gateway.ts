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
import { CreateQuizDto } from 'src/quizzes/dto/create-quiz.dto';
import { QuizzesService } from 'src/quizzes/quizzes.service';

@WebSocketGateway({
  namespace: 'lobbies',
  cors: {
    origin: '*',
  },
})
@UseGuards(JwtWsGuard)
export class LobbiesGateway {
  constructor(
    private readonly lobbiesService: LobbiesService,
    private readonly quizzesService: QuizzesService,
  ) {}

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
      client.emit('lobby:created', lobby);
    } catch (error) {
      console.error('Error in create-lobby:', error);
      client.emit('error', {
        message: 'Internal server error',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('lobby:join')
  handleMessageJoin(client: Socket, lobbyId: string) {
    if (client.rooms.size > 0) return; // Si le client est déjà dans une salle, on ne le laisse pas rejoindre une autre
    client.join(lobbyId);
    client.to(lobbyId).emit('lobby:user-join', (client as any).user);
    client.emit('lobby:joined', lobbyId);
  }

  @SubscribeMessage('lobby:leave')
  async handleMessageLeave(client: Socket, lobbyId: string) {
    console.log('Leaving lobby:', lobbyId, client.rooms);
    // if (client.rooms.has(lobbyId)) {
      client.leave(lobbyId);
      const user = (client as any).user;
      await this.lobbiesService.leave(user.sub, lobbyId);
      client.to(lobbyId).emit('lobby:user-leave', user);
      client.emit('lobby:left', lobbyId);
    // }
  }

  @SubscribeMessage('lobby:generate:quizz')
  async handleMessageGenerateQuizz(client: Socket, payload: CreateQuizDto) {
    client.join(payload.lobby);
    const user = (client as any).user;

    let quizz = await this.quizzesService.getQuizzForLobby(payload.lobby);

    if (!quizz) {
      quizz = await this.quizzesService.create(payload);
    }

    if (!quizz) {
      client.emit('error', { message: 'Error creating quiz' });
      return;
    }

    client.to(payload.lobby).emit('lobby:quizz-generated', quizz);
    client.emit('lobby:quizz-generated', quizz);
  }

  @SubscribeMessage('lobby:start:quizz')
  async handleMessageStartQuizz(client: Socket, payload: { lobbyId: string }) {
    const user = (client as any).user;
    const quizz = await this.quizzesService.getQuizzForLobby(payload.lobbyId);
    if (!quizz) {
      client.emit('error', { message: 'No quiz found for this lobby' });
      return;
    }
    quizz.questionIndex = 1;
    quizz.save();
    client.to(payload.lobbyId).emit('lobby:quizz-started', quizz);
    client.emit('lobby:quizz-started', quizz);
  }
}

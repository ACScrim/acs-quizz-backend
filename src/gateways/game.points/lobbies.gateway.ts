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
import { QuizBattleRoyal } from 'src/quizzes/entities/quiz.battleroyal.entity';
import { QuizPoints } from 'src/quizzes/entities/quiz.points.entity';
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

  quizzes = new Map<string, { timeLeft: number; }>();

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
  async handleMessageJoin(client: Socket, lobbyId: string) {
    // if (client.rooms.size > 0) return; // Si le client est déjà dans une salle, on ne le laisse pas rejoindre une autre
    client.join(lobbyId);
    client.to(lobbyId).emit('lobby:user-join', (client as any).user);
    client.emit('lobby:joined', {
      quizz: await (await this.quizzesService.getQuizzForLobby(lobbyId))?.populate({ path: 'questions', select: '-answer' }),
      timeLeft: this.quizzes.get(lobbyId)?.timeLeft ?? 0,
      lobbyId: lobbyId,
    });
  }

  @SubscribeMessage('lobby:leave')
  async handleMessageLeave(client: Socket, lobbyId: string) {
    console.log('Leaving lobby:', lobbyId, client.rooms);
    // if (client.rooms.has(lobbyId)) {
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
    quizz.status = 'in_progress';
    quizz.save();
    await quizz.populate({
      path: 'questions',
      select: '-answer',
    });
    client.to(payload.lobbyId).emit('lobby:quizz-started', quizz);
    client.emit('lobby:quizz-started', quizz);
    this.startQuestionTimer(client, payload.lobbyId);
  }

  @SubscribeMessage('lobby:stop:quizz')
  async handleMessageStopQuizz(client: Socket, lobbyId: string) {
    const user = (client as any).user;
    const quizz = await this.quizzesService.getQuizzForLobby(lobbyId);
    if (!quizz) {
      client.emit('error', { message: 'No quiz found for this lobby' });
      return;
    }
    this.quizzes.delete(lobbyId);
    quizz.status = 'finished';
    quizz.save();
    client.to(lobbyId).emit('lobby:quizz-stopped', quizz);
    client.emit('lobby:quizz-stopped', quizz);
  }

  @SubscribeMessage('lobby:quizz:submit-answer')
  async handleMessageSubmitAnswer(
    client: Socket,
    payload: {
      lobbyId: string;
      quizzId: string;
      answer: string; // valeur de la réponse
    },
  ) {
    const user = (client as any).user;

    const quizz = await (
      await this.quizzesService.getQuizzForLobby(payload.lobbyId)
    )?.populate('questions');
    if (!quizz) {
      client.emit('error', { message: 'No quiz found for this lobby' });
      return;
    }

    const question = quizz.questions[quizz.questionIndex];
    if (!question) {
      client.emit('error', { message: 'No question found for this quiz' });
      return;
    }

    const isCorrect = question.answer === payload.answer;
    if (quizz.gameMode === 'battleRoyal' && !isCorrect) {
      const brQuizz = quizz as unknown as QuizBattleRoyal;
      console.log('Player lives:', brQuizz.playerLives);
      if (!brQuizz.playerLives) brQuizz.playerLives = {};
      console.log(
        'Player lives before deduction:',
        brQuizz.playerLives[user.sub],
        'Max lives:',
        brQuizz.maxLives,
      );
      const currentLives = brQuizz.playerLives[user.sub] ?? brQuizz.maxLives;
      console.log('Current lives:', currentLives);
      brQuizz.playerLives[user.sub] = Math.max(0, currentLives - 1);
      console.log(
        'Player lives after deduction:',
        brQuizz.playerLives[user.sub],
        'Max lives:',
        brQuizz.maxLives,
      );
      brQuizz.markModified('playerLives');
      await brQuizz.save();
    }

    if (quizz.gameMode === 'points' && isCorrect) {
      const pointsQuizz = quizz as unknown as QuizPoints;
      pointsQuizz.playerPoints[user.sub] =
        (pointsQuizz.playerPoints[user.sub] || 0) + 1;
      pointsQuizz.markModified('playerPoints');
      await pointsQuizz.save();
    }

    // Envoie les scores à tous
    client.to(payload.lobbyId).emit('lobby:quizz:update-scores', {
      playerPoints: (quizz as unknown as QuizPoints).playerPoints ?? null,
      playerLives: (quizz as unknown as QuizBattleRoyal).playerLives ?? null,
    });
    client.emit('lobby:quizz:update-scores', {
      playerPoints: (quizz as unknown as QuizPoints).playerPoints ?? null,
      playerLives: (quizz as unknown as QuizBattleRoyal).playerLives ?? null,
    });
    client.emit('lobby:quizz:answer-result', {
      isCorrect,
      correctAnswer: question.answer,
    });
  }

  // Executed by quizz owner
  @SubscribeMessage('lobby:quizz:next-question')
  async handleMessageNextQuestion(
    client: Socket,
    payload: { lobbyId: string; quizzId: string },
  ) {
    const user = (client as any).user;
    const quizz = await this.quizzesService.getQuizzForLobby(payload.lobbyId);
    if (!quizz) {
      client.emit('error', { message: 'No quiz found for this lobby' });
      return;
    }

    quizz.questionIndex = (quizz.questionIndex + 1) % quizz.questions.length;
    quizz.save();
    await quizz.populate({
      path: 'questions',
      select: '-answer',
    });
    client.to(payload.lobbyId).emit('lobby:quizz:next-question', quizz);
    client.emit('lobby:quizz:new-question', quizz);
    this.startQuestionTimer(client, payload.lobbyId);
  }

  private startQuestionTimer(client: Socket, lobbyId: string) {
    const startTime = Date.now();
    const questionDuration = 10; // Durée de la question en secondes
    const endTime = startTime + questionDuration * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, endTime - now);
      // Transform timeLeft to seconds
      const secondsLeft = Math.floor(timeLeft / 1000);
      if (timeLeft <= 0) {
        clearInterval(interval);
        client.emit('lobby:quizz:answering-time-up');
        client.to(lobbyId).emit('lobby:quizz:answering-time-up');
      }
      this.quizzes.set(lobbyId, { timeLeft: secondsLeft });
      // Emit the time left to the client
      client.emit('lobby:quizz:answering-time-left', secondsLeft);
      client.to(lobbyId).emit('lobby:quizz:answering-time-left', secondsLeft);
    }, 1000);
    return interval;
  }
}

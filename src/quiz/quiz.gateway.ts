import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameSession } from '../game-sessions/entities/game-session.entity';
import { Participant } from '../participants/entities/participant.entity';
import { SessionQuestion } from '../session-questions/entities/session-question.entity';
import { ParticipantAnswer } from '../participant-answers/entities/participant-answer.entity';
import { Question } from '../questions/entities/question.entity';
import { User } from '../users/entities/user.entity';
import { GameSessionStatus, ParticipantStatus, GameModeType } from '../types';

// DTOs pour les événements WebSocket
export interface JoinGameData {
  joinCode: string;
  userId: string;
}

export interface AnswerQuestionData {
  sessionQuestionId: string;
  selectedAnswer: string;
  responseTime: number;
}

export interface StartGameData {
  gameSessionId: string;
}

export interface NextQuestionData {
  gameSessionId: string;
}

export interface KickPlayerData {
  gameSessionId: string;
  participantId: string;
}

// Interfaces pour les réponses
export interface GameState {
  gameSession: any;
  participants: any[];
  currentQuestion?: any;
  timeRemaining?: number;
  scores?: any[];
}

export interface QuestionData {
  sessionQuestion: any;
  question: any;
  timeLimit: number;
  questionNumber: number;
  totalQuestions: number;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/quiz',
})
export class QuizGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QuizGateway.name);
  private connectedUsers = new Map<string, { socket: Socket; userId: string; gameSessionId?: string }>();
  private gameRooms = new Map<string, Set<string>>(); // gameSessionId -> Set of socketIds
  private questionTimers = new Map<string, NodeJS.Timeout>(); // gameSessionId -> timer

  constructor(
    @InjectModel(GameSession.name) private gameSessionModel: Model<GameSession>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    @InjectModel(SessionQuestion.name) private sessionQuestionModel: Model<SessionQuestion>,
    @InjectModel(ParticipantAnswer.name) private participantAnswerModel: Model<ParticipantAnswer>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Quiz WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const userInfo = this.connectedUsers.get(client.id);
    if (userInfo && userInfo.gameSessionId) {
      await this.handlePlayerDisconnection(client.id, userInfo.gameSessionId, userInfo.userId);
    }
    
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string }
  ) {
    this.connectedUsers.set(client.id, {
      socket: client,
      userId: data.userId,
    });
    
    client.emit('authenticated', { success: true });
    this.logger.log(`User ${data.userId} authenticated`);
  }

  @SubscribeMessage('join-game')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinGameData
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Vérifier si la session existe et est disponible
      const gameSession = await this.gameSessionModel
        .findOne({ joinCode: data.joinCode })
        .populate('host');
      
      if (!gameSession) {
        client.emit('join-game-error', { message: 'Game session not found' });
        return;
      }

      if (gameSession.status !== GameSessionStatus.WAITING) {
        client.emit('join-game-error', { message: 'Game session is not accepting new players' });
        return;
      }

      // Vérifier si l'utilisateur peut rejoindre
      const existingParticipant = await this.participantModel
        .findOne({ 
          userId: data.userId, 
          gameSessionId: gameSession._id 
        });

      let participant;
      if (existingParticipant) {
        // Réactiver le participant s'il était déconnecté
        participant = await this.participantModel.findByIdAndUpdate(
          existingParticipant._id,
          { status: ParticipantStatus.ACTIVE },
          { new: true }
        );
      } else {
        // Créer un nouveau participant
        participant = await this.participantModel.create({
          userId: data.userId,
          gameSessionId: gameSession._id,
          status: ParticipantStatus.ACTIVE,
          score: 0,
          lives: gameSession.gameMode === GameModeType.BATTLE_ROYALE ? gameSession.initialLives : undefined,
        });
      }      // Joindre la room
      const roomId = (gameSession._id as any).toString();
      client.join(roomId);
      
      // Mettre à jour les informations de connexion
      userInfo.gameSessionId = roomId;
      this.connectedUsers.set(client.id, userInfo);
      
      // Ajouter à la room
      if (!this.gameRooms.has(roomId)) {
        this.gameRooms.set(roomId, new Set());
      }
      this.gameRooms.get(roomId)!.add(client.id);

      // Envoyer la confirmation au joueur
      const gameState = await this.getGameState((gameSession._id as any).toString());
      client.emit('join-game-success', {
        gameSession,
        participant,
        gameState,
      });

      // Notifier tous les autres participants
      client.to(roomId).emit('player-joined', {
        participant: await this.participantModel.findById(participant._id).populate('userId'),
        totalPlayers: gameState.participants.length,
      });

      this.logger.log(`User ${data.userId} joined game ${roomId}`);
    } catch (error) {
      this.logger.error('Error joining game:', error);
      client.emit('join-game-error', { message: 'Failed to join game' });
    }
  }

  @SubscribeMessage('leave-game')
  async handleLeaveGame(@ConnectedSocket() client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    if (!userInfo || !userInfo.gameSessionId) {
      return;
    }

    await this.handlePlayerDisconnection(client.id, userInfo.gameSessionId, userInfo.userId);
  }

  @SubscribeMessage('start-game')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StartGameData
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const gameSession = await this.gameSessionModel.findById(data.gameSessionId);
      if (!gameSession) {
        client.emit('error', { message: 'Game session not found' });
        return;
      }

      // Vérifier que l'utilisateur est l'hôte
      if (gameSession.host.toString() !== userInfo.userId) {
        client.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      if (gameSession.status !== GameSessionStatus.WAITING) {
        client.emit('error', { message: 'Game cannot be started' });
        return;
      }

      // Démarrer la session
      await this.gameSessionModel.findByIdAndUpdate(data.gameSessionId, {
        status: GameSessionStatus.IN_PROGRESS,
        startedAt: new Date(),
        currentQuestionIndex: 0,
      });
      
      // Notifier tous les participants
      this.server.to(data.gameSessionId).emit('game-started', {
        message: 'Game is starting!',
        gameSessionId: data.gameSessionId,
      });

      // Démarrer la première question après un délai
      setTimeout(() => {
        this.presentNextQuestion(data.gameSessionId);
      }, 3000);

      this.logger.log(`Game ${data.gameSessionId} started by host ${userInfo.userId}`);
    } catch (error) {
      this.logger.error('Error starting game:', error);
      client.emit('error', { message: 'Failed to start game' });
    }
  }

  @SubscribeMessage('answer-question')
  async handleAnswerQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AnswerQuestionData
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo || !userInfo.gameSessionId) {
        client.emit('error', { message: 'User not authenticated or not in game' });
        return;
      }

      const participant = await this.participantModel.findOne({
        userId: userInfo.userId,
        gameSessionId: userInfo.gameSessionId,
      });

      if (!participant || participant.status !== ParticipantStatus.ACTIVE) {
        client.emit('error', { message: 'Participant not active' });
        return;
      }

      // Vérifier si l'utilisateur a déjà répondu à cette question
      const existingAnswer = await this.participantAnswerModel.findOne({
        participantId: participant._id,
        sessionQuestionId: data.sessionQuestionId,
      });

      if (existingAnswer) {
        client.emit('error', { message: 'Already answered this question' });
        return;
      }

      // Récupérer les détails de la question
      const sessionQuestion = await this.sessionQuestionModel
        .findById(data.sessionQuestionId)
        .populate('questionId');
      
      if (!sessionQuestion) {
        client.emit('error', { message: 'Question not found' });
        return;
      }      const question = sessionQuestion.questionId as any;
      const gameSession = await this.gameSessionModel.findById(userInfo.gameSessionId);
      
      if (!gameSession) {
        client.emit('error', { message: 'Game session not found' });
        return;
      }
      
      const isCorrect = data.selectedAnswer === question.answer;
      
      // Calculer les points
      let pointsAwarded = 0;
      if (isCorrect) {
        pointsAwarded = gameSession.pointsForCorrect || 100;
        
        // Bonus de vitesse si configuré
        if (gameSession.pointsForSpeed) {
          const speedBonus = Math.max(0, gameSession.pointsForSpeed - Math.floor(data.responseTime / 1000));
          pointsAwarded += speedBonus;
        }
      }

      // Créer la réponse
      const answer = await this.participantAnswerModel.create({
        participantId: participant._id,
        sessionQuestionId: data.sessionQuestionId,
        selectedAnswer: data.selectedAnswer,
        responseTime: data.responseTime,
        isCorrect,
        pointsAwarded,
      });

      // Mettre à jour le score du participant
      await this.participantModel.findByIdAndUpdate(participant._id, {
        $inc: { score: pointsAwarded }
      });

      // Gérer la logique Battle Royale
      if (gameSession.gameMode === GameModeType.BATTLE_ROYALE && !isCorrect) {
        const updatedParticipant = await this.participantModel.findByIdAndUpdate(
          participant._id,
          { $inc: { lives: -1 } },
          { new: true }
        );
        
        if (updatedParticipant && updatedParticipant.lives !== undefined && updatedParticipant.lives <= 0) {
          await this.participantModel.findByIdAndUpdate(participant._id, {
            status: ParticipantStatus.ELIMINATED
          });
          
          // Notifier l'élimination
          client.emit('player-eliminated', { message: 'You have been eliminated!' });
          this.server.to(userInfo.gameSessionId).emit('player-eliminated-broadcast', {
            participantId: participant._id,
            username: (participant.userId as any).username,
          });
        }
      }

      // Confirmer la réponse au joueur
      client.emit('answer-submitted', {
        isCorrect,
        pointsAwarded,
        correctAnswer: question.answer,
      });

      // Notifier aux autres participants qu'un joueur a répondu
      client.to(userInfo.gameSessionId).emit('player-answered', {
        participantId: participant._id,
        hasAnswered: true,
      });

      this.logger.log(`Player ${userInfo.userId} answered question ${data.sessionQuestionId}`);
    } catch (error) {
      this.logger.error('Error handling answer:', error);
      client.emit('error', { message: 'Failed to submit answer' });
    }
  }

  @SubscribeMessage('kick-player')
  async handleKickPlayer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: KickPlayerData
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const gameSession = await this.gameSessionModel.findById(data.gameSessionId);
      if (!gameSession || gameSession.host.toString() !== userInfo.userId) {
        client.emit('error', { message: 'Only the host can kick players' });
        return;
      }

      // Mettre à jour le statut du participant
      await this.participantModel.findByIdAndUpdate(data.participantId, {
        status: ParticipantStatus.DISCONNECTED
      });      // Trouver le socket du joueur à expulser
      const participantToKick = await this.participantModel
        .findById(data.participantId)
        .populate('userId');
      
      if (!participantToKick) {
        client.emit('error', { message: 'Participant not found' });
        return;
      }
      
      const socketToKick = Array.from(this.connectedUsers.entries()).find(
        ([_, info]) => info.userId === (participantToKick.userId as any)._id.toString()
      );

      if (socketToKick) {
        const [socketId, socketInfo] = socketToKick;
        socketInfo.socket.emit('kicked-from-game', { message: 'You have been kicked from the game' });
        socketInfo.socket.leave(data.gameSessionId);
        this.connectedUsers.delete(socketId);
      }

      // Notifier les autres participants
      this.server.to(data.gameSessionId).emit('player-kicked', {
        participantId: data.participantId,
        username: (participantToKick.userId as any).username,
      });

      this.logger.log(`Player ${data.participantId} was kicked from game ${data.gameSessionId}`);
    } catch (error) {
      this.logger.error('Error kicking player:', error);
      client.emit('error', { message: 'Failed to kick player' });
    }
  }

  @SubscribeMessage('get-game-state')
  async handleGetGameState(@ConnectedSocket() client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    if (!userInfo || !userInfo.gameSessionId) {
      client.emit('error', { message: 'User not authenticated or not in game' });
      return;
    }

    try {
      const gameState = await this.getGameState(userInfo.gameSessionId);
      client.emit('game-state', gameState);
    } catch (error) {
      this.logger.error('Error getting game state:', error);
      client.emit('error', { message: 'Failed to get game state' });
    }
  }

  @SubscribeMessage('get-leaderboard')
  async handleGetLeaderboard(@ConnectedSocket() client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    if (!userInfo || !userInfo.gameSessionId) {
      client.emit('error', { message: 'User not authenticated or not in game' });
      return;
    }

    try {
      const leaderboard = await this.getLeaderboard(userInfo.gameSessionId);
      client.emit('leaderboard', leaderboard);
    } catch (error) {
      this.logger.error('Error getting leaderboard:', error);
      client.emit('error', { message: 'Failed to get leaderboard' });
    }
  }

  // Méthodes utilitaires privées

  private async handlePlayerDisconnection(socketId: string, gameSessionId: string, userId: string) {
    try {
      // Mettre à jour le statut du participant
      const participant = await this.participantModel.findOne({
        userId,
        gameSessionId,
      });
      
      if (participant) {
        await this.participantModel.findByIdAndUpdate(participant._id, {
          status: ParticipantStatus.DISCONNECTED
        });
      }

      // Retirer de la room
      const gameRoom = this.gameRooms.get(gameSessionId);
      if (gameRoom) {
        gameRoom.delete(socketId);
        if (gameRoom.size === 0) {
          this.gameRooms.delete(gameSessionId);
          this.clearQuestionTimer(gameSessionId);
        }
      }

      // Notifier les autres participants
      this.server.to(gameSessionId).emit('player-disconnected', {
        participantId: participant?._id,
        userId,
      });

      this.logger.log(`Player ${userId} disconnected from game ${gameSessionId}`);
    } catch (error) {
      this.logger.error('Error handling player disconnection:', error);
    }
  }

  private async presentNextQuestion(gameSessionId: string) {
    try {
      const gameSession = await this.gameSessionModel.findById(gameSessionId);
      if (!gameSession || gameSession.status !== GameSessionStatus.IN_PROGRESS) {
        return;
      }

      // Récupérer la prochaine question
      const nextQuestionOrder = gameSession.currentQuestionIndex;
      const sessionQuestion = await this.sessionQuestionModel
        .findOne({
          gameSessionId,
          order: nextQuestionOrder,
        })
        .populate('questionId');

      if (!sessionQuestion) {
        // Fin du quiz
        await this.endGame(gameSessionId);
        return;
      }

      // Marquer la question comme présentée
      const presentedAt = new Date();
      const endsAt = new Date(presentedAt.getTime() + (gameSession.timePerQuestion * 1000));
      
      await this.sessionQuestionModel.findByIdAndUpdate(sessionQuestion._id, {
        presentedAt,
        endsAt,
      });

      // Préparer les données de la question (sans la réponse correcte)
      const question = sessionQuestion.questionId as any;
      const questionData: QuestionData = {
        sessionQuestion: {
          _id: sessionQuestion._id,
          order: sessionQuestion.order,
          presentedAt,
          endsAt,
        },
        question: {
          _id: question._id,
          question: question.question,
          options: question.options,
          difficulty: question.difficulty,
          category: question.category,
        },
        timeLimit: gameSession.timePerQuestion,
        questionNumber: nextQuestionOrder + 1,
        totalQuestions: gameSession.numberOfQuestions,
      };

      // Envoyer la question à tous les participants actifs
      this.server.to(gameSessionId).emit('new-question', questionData);      // Démarrer le timer pour cette question
      this.startQuestionTimer(gameSessionId, (sessionQuestion._id as any).toString(), gameSession.timePerQuestion);

      this.logger.log(`Question ${nextQuestionOrder + 1} presented for game ${gameSessionId}`);
    } catch (error) {
      this.logger.error('Error presenting next question:', error);
    }
  }

  private startQuestionTimer(gameSessionId: string, sessionQuestionId: string, timeLimit: number) {
    // Nettoyer le timer précédent s'il existe
    this.clearQuestionTimer(gameSessionId);

    const timer = setTimeout(async () => {
      await this.handleQuestionTimeout(gameSessionId, sessionQuestionId);
    }, timeLimit * 1000);

    this.questionTimers.set(gameSessionId, timer);

    // Envoyer des mises à jour de timer toutes les secondes
    let remainingTime = timeLimit;
    const countdownInterval = setInterval(() => {
      remainingTime--;
      this.server.to(gameSessionId).emit('timer-update', { remainingTime });
      
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  private clearQuestionTimer(gameSessionId: string) {
    const timer = this.questionTimers.get(gameSessionId);
    if (timer) {
      clearTimeout(timer);
      this.questionTimers.delete(gameSessionId);
    }
  }

  private async handleQuestionTimeout(gameSessionId: string, sessionQuestionId: string) {
    try {
      // Récupérer les réponses et les détails de la question
      const answers = await this.participantAnswerModel
        .find({ sessionQuestionId })
        .populate('participantId');
        const sessionQuestion = await this.sessionQuestionModel
        .findById(sessionQuestionId)
        .populate('questionId');
      
      if (!sessionQuestion) {
        this.logger.error('Session question not found');
        return;
      }
      
      const question = sessionQuestion.questionId as any;

      // Révéler les réponses et statistiques
      this.server.to(gameSessionId).emit('question-results', {
        correctAnswer: question.answer,
        answers: answers.map(answer => ({
          participantId: answer.participantId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: answer.isCorrect,
          responseTime: answer.responseTime,
          pointsAwarded: answer.pointsAwarded,
        })),
        statistics: this.calculateQuestionStatistics(answers),
      });

      // Envoyer le leaderboard mis à jour
      const leaderboard = await this.getLeaderboard(gameSessionId);
      this.server.to(gameSessionId).emit('leaderboard-update', leaderboard);

      // Incrémenter l'index de la question courante
      await this.gameSessionModel.findByIdAndUpdate(gameSessionId, {
        $inc: { currentQuestionIndex: 1 }
      });

      // Attendre quelques secondes puis passer à la question suivante
      setTimeout(() => {
        this.presentNextQuestion(gameSessionId);
      }, 5000);

      this.logger.log(`Question timeout handled for game ${gameSessionId}`);
    } catch (error) {
      this.logger.error('Error handling question timeout:', error);
    }
  }

  private async endGame(gameSessionId: string) {
    try {
      // Marquer la session comme terminée
      await this.gameSessionModel.findByIdAndUpdate(gameSessionId, {
        status: GameSessionStatus.COMPLETED,
        endedAt: new Date(),
      });

      // Calculer les classements finaux
      const finalLeaderboard = await this.getLeaderboard(gameSessionId);
      
      // Mettre à jour les rangs des participants
      for (let i = 0; i < finalLeaderboard.length; i++) {
        await this.participantModel.findByIdAndUpdate(finalLeaderboard[i]._id, {
          rank: i + 1
        });
      }

      // Envoyer les résultats finaux
      this.server.to(gameSessionId).emit('game-ended', {
        finalLeaderboard,
        gameStats: await this.getGameStatistics(gameSessionId),
      });

      // Nettoyer les timers
      this.clearQuestionTimer(gameSessionId);

      this.logger.log(`Game ${gameSessionId} ended`);
    } catch (error) {
      this.logger.error('Error ending game:', error);
    }
  }
  private async getGameState(gameSessionId: string): Promise<GameState> {
    const gameSession = await this.gameSessionModel.findById(gameSessionId).populate('host');
    const participants = await this.participantModel
      .find({ gameSessionId })
      .populate('userId');
    
    if (!gameSession) {
      throw new Error('Game session not found');
    }
    
    const currentQuestion = await this.sessionQuestionModel
      .findOne({
        gameSessionId,
        order: gameSession.currentQuestionIndex,
      })
      .populate('questionId');

    return {
      gameSession,
      participants,
      currentQuestion,
      scores: await this.getLeaderboard(gameSessionId),
    };
  }

  private async getLeaderboard(gameSessionId: string) {
    return await this.participantModel
      .find({ gameSessionId })
      .sort({ score: -1, joinedAt: 1 })
      .populate('userId')
      .lean();
  }

  private calculateQuestionStatistics(answers: any[]) {
    const total = answers.length;
    const correct = answers.filter(a => a.isCorrect).length;
    const averageTime = total > 0 ? answers.reduce((sum, a) => sum + a.responseTime, 0) / total : 0;

    return {
      totalAnswers: total,
      correctAnswers: correct,
      incorrectAnswers: total - correct,
      correctPercentage: total > 0 ? (correct / total) * 100 : 0,
      averageResponseTime: averageTime,
    };
  }
  private async getGameStatistics(gameSessionId: string) {
    const participants = await this.participantModel.find({ gameSessionId });
    const gameSession = await this.gameSessionModel.findById(gameSessionId);
    const totalQuestions = await this.sessionQuestionModel.countDocuments({ gameSessionId });
    
    if (!gameSession) {
      throw new Error('Game session not found');
    }
    
    return {
      totalParticipants: participants.length,
      totalQuestions,
      gameMode: gameSession.gameMode,
      duration: gameSession.endedAt && gameSession.startedAt ? 
        gameSession.endedAt.getTime() - gameSession.startedAt.getTime() : 0,
    };
  }
}

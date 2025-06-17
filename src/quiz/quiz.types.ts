// Types et interfaces pour le Quiz Gateway

import { GameSession } from '../game-sessions/entities/game-session.entity';
import { Participant } from '../participants/entities/participant.entity';
import { SessionQuestion } from '../session-questions/entities/session-question.entity';
import { Question } from '../questions/entities/question.entity';
import { User } from '../users/entities/user.entity';
import { GameSessionStatus, ParticipantStatus, GameModeType } from '../types';

// Interface pour les utilisateurs connectés
export interface ConnectedUser {
  socket: any; // Socket.IO socket
  userId: string;
  gameSessionId?: string;
}

// Interface pour l'état du jeu
export interface GameState {
  gameSession: GameSession;
  participants: Participant[];
  currentQuestion?: SessionQuestion;
  timeRemaining?: number;
  scores: Participant[];
}

// Interface pour les données d'une question présentée
export interface QuestionData {
  sessionQuestion: {
    _id: string;
    order: number;
    presentedAt: Date;
    endsAt: Date;
  };
  question: {
    _id: string;
    question: string;
    options: string[];
    difficulty: string;
    category: any;
  };
  timeLimit: number;
  questionNumber: number;
  totalQuestions: number;
}

// Interface pour les réponses des participants
export interface PlayerAnswer {
  participantId: string;
  username: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  pointsAwarded: number;
}

// Interface pour les statistiques d'une question
export interface QuestionStatistics {
  totalAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  correctPercentage: number;
  averageResponseTime: number;
}

// Interface pour les statistiques d'une session de jeu
export interface GameStatistics {
  totalParticipants: number;
  totalQuestions: number;
  gameMode: GameModeType;
  duration: number; // en millisecondes
}

// Interface pour le classement
export interface LeaderboardEntry {
  _id: string;
  userId: User;
  score: number;
  status: ParticipantStatus;
  lives?: number;
  rank?: number;
  joinedAt: Date;
}

// Types pour les événements WebSocket entrants
export interface JoinGameEvent {
  joinCode: string;
  userId: string;
}

export interface AnswerQuestionEvent {
  sessionQuestionId: string;
  selectedAnswer: string;
  responseTime: number;
}

export interface StartGameEvent {
  gameSessionId: string;
}

export interface KickPlayerEvent {
  gameSessionId: string;
  participantId: string;
}

export interface AuthenticateEvent {
  userId: string;
}

// Types pour les événements WebSocket sortants
export interface JoinGameSuccessEvent {
  gameSession: GameSession;
  participant: Participant;
  gameState: GameState;
}

export interface JoinGameErrorEvent {
  message: string;
}

export interface PlayerJoinedEvent {
  participant: Participant;
  totalPlayers: number;
}

export interface PlayerDisconnectedEvent {
  participantId: string;
  userId: string;
}

export interface GameStartedEvent {
  message: string;
  gameSessionId: string;
}

export interface NewQuestionEvent {
  sessionQuestion: QuestionData['sessionQuestion'];
  question: QuestionData['question'];
  timeLimit: number;
  questionNumber: number;
  totalQuestions: number;
}

export interface TimerUpdateEvent {
  remainingTime: number;
}

export interface AnswerSubmittedEvent {
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: string;
}

export interface PlayerAnsweredEvent {
  participantId: string;
  hasAnswered: boolean;
}

export interface QuestionResultsEvent {
  correctAnswer: string;
  answers: PlayerAnswer[];
  statistics: QuestionStatistics;
}

export interface LeaderboardUpdateEvent {
  leaderboard: LeaderboardEntry[];
}

export interface PlayerEliminatedEvent {
  message: string;
}

export interface PlayerEliminatedBroadcastEvent {
  participantId: string;
  username: string;
}

export interface PlayerKickedEvent {
  participantId: string;
  username: string;
}

export interface KickedFromGameEvent {
  message: string;
}

export interface GameEndedEvent {
  finalLeaderboard: LeaderboardEntry[];
  gameStats: GameStatistics;
}

export interface ErrorEvent {
  message: string;
}

export interface AuthenticatedEvent {
  success: boolean;
}

// Types pour les timers
export interface QuestionTimer {
  gameSessionId: string;
  timer: NodeJS.Timeout;
  sessionQuestionId: string;
  timeLimit: number;
}

// Types pour les salles de jeu
export type GameRoom = Set<string>; // Set d'IDs de sockets

// Interface pour les données populées
export interface PopulatedGameSession extends Omit<GameSession, 'host'> {
  host: User;
}

export interface PopulatedParticipant extends Omit<Participant, 'userId'> {
  userId: User;
}

export interface PopulatedSessionQuestion extends Omit<SessionQuestion, 'questionId'> {
  questionId: Question;
}

// Énumérations pour les types d'événements
export enum QuizEventType {
  AUTHENTICATE = 'authenticate',
  JOIN_GAME = 'join-game',
  LEAVE_GAME = 'leave-game',
  START_GAME = 'start-game',
  ANSWER_QUESTION = 'answer-question',
  KICK_PLAYER = 'kick-player',
  GET_GAME_STATE = 'get-game-state',
  GET_LEADERBOARD = 'get-leaderboard',
}

export enum QuizResponseType {
  AUTHENTICATED = 'authenticated',
  JOIN_GAME_SUCCESS = 'join-game-success',
  JOIN_GAME_ERROR = 'join-game-error',
  PLAYER_JOINED = 'player-joined',
  PLAYER_DISCONNECTED = 'player-disconnected',
  GAME_STARTED = 'game-started',
  NEW_QUESTION = 'new-question',
  TIMER_UPDATE = 'timer-update',
  ANSWER_SUBMITTED = 'answer-submitted',
  PLAYER_ANSWERED = 'player-answered',
  QUESTION_RESULTS = 'question-results',
  LEADERBOARD_UPDATE = 'leaderboard-update',
  LEADERBOARD = 'leaderboard',
  GAME_STATE = 'game-state',
  PLAYER_ELIMINATED = 'player-eliminated',
  PLAYER_ELIMINATED_BROADCAST = 'player-eliminated-broadcast',
  PLAYER_KICKED = 'player-kicked',
  KICKED_FROM_GAME = 'kicked-from-game',
  GAME_ENDED = 'game-ended',
  ERROR = 'error',
}

// Type guards pour vérifier les types d'événements
export function isJoinGameEvent(data: any): data is JoinGameEvent {
  return data && typeof data.joinCode === 'string' && typeof data.userId === 'string';
}

export function isAnswerQuestionEvent(data: any): data is AnswerQuestionEvent {
  return data && 
    typeof data.sessionQuestionId === 'string' && 
    typeof data.selectedAnswer === 'string' && 
    typeof data.responseTime === 'number';
}

export function isStartGameEvent(data: any): data is StartGameEvent {
  return data && typeof data.gameSessionId === 'string';
}

export function isKickPlayerEvent(data: any): data is KickPlayerEvent {
  return data && 
    typeof data.gameSessionId === 'string' && 
    typeof data.participantId === 'string';
}

export function isAuthenticateEvent(data: any): data is AuthenticateEvent {
  return data && typeof data.userId === 'string';
}

// Constantes pour les événements WebSocket du Quiz

// Événements entrants (du client vers le serveur)
export const QUIZ_EVENTS = {
  // Authentification
  AUTHENTICATE: 'authenticate',
  
  // Gestion des sessions
  JOIN_GAME: 'join-game',
  LEAVE_GAME: 'leave-game',
  START_GAME: 'start-game',
  
  // Questions et réponses
  ANSWER_QUESTION: 'answer-question',
  
  // Administration
  KICK_PLAYER: 'kick-player',
  
  // État du jeu
  GET_GAME_STATE: 'get-game-state',
  GET_LEADERBOARD: 'get-leaderboard',
} as const;

// Événements sortants (du serveur vers le client)
export const QUIZ_RESPONSES = {
  // Authentification
  AUTHENTICATED: 'authenticated',
  
  // Rejoindre une session
  JOIN_GAME_SUCCESS: 'join-game-success',
  JOIN_GAME_ERROR: 'join-game-error',
  
  // État des joueurs
  PLAYER_JOINED: 'player-joined',
  PLAYER_DISCONNECTED: 'player-disconnected',
  PLAYER_ANSWERED: 'player-answered',
  PLAYER_ELIMINATED: 'player-eliminated',
  PLAYER_ELIMINATED_BROADCAST: 'player-eliminated-broadcast',
  PLAYER_KICKED: 'player-kicked',
  KICKED_FROM_GAME: 'kicked-from-game',
  
  // Déroulement du jeu
  GAME_STARTED: 'game-started',
  NEW_QUESTION: 'new-question',
  TIMER_UPDATE: 'timer-update',
  ANSWER_SUBMITTED: 'answer-submitted',
  QUESTION_RESULTS: 'question-results',
  
  // Classements et états
  LEADERBOARD_UPDATE: 'leaderboard-update',
  LEADERBOARD: 'leaderboard',
  GAME_STATE: 'game-state',
  
  // Fin de session
  GAME_ENDED: 'game-ended',
  
  // Erreurs
  ERROR: 'error',
} as const;

// Types pour les données des événements
export interface AuthenticateData {
  userId: string;
}

export interface JoinGameData {
  joinCode: string;
  userId: string;
}

export interface StartGameData {
  gameSessionId: string;
}

export interface AnswerQuestionData {
  sessionQuestionId: string;
  selectedAnswer: string;
  responseTime: number;
}

export interface KickPlayerData {
  gameSessionId: string;
  participantId: string;
}

// Types pour les réponses
export interface AuthenticatedResponse {
  success: boolean;
}

export interface JoinGameSuccessResponse {
  gameSession: any;
  participant: any;
  gameState: any;
}

export interface JoinGameErrorResponse {
  message: string;
}

export interface PlayerJoinedResponse {
  participant: any;
  totalPlayers: number;
}

export interface GameStartedResponse {
  message: string;
  gameSessionId: string;
}

export interface NewQuestionResponse {
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
    category: string;
  };
  timeLimit: number;
  questionNumber: number;
  totalQuestions: number;
}

export interface TimerUpdateResponse {
  remainingTime: number;
}

export interface AnswerSubmittedResponse {
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: string;
}

export interface QuestionResultsResponse {
  correctAnswer: string;
  answers: Array<{
    participantId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    responseTime: number;
    pointsAwarded: number;
  }>;
  statistics: {
    totalAnswers: number;
    correctAnswers: number;
    incorrectAnswers: number;
    correctPercentage: number;
    averageResponseTime: number;
  };
}

export interface GameEndedResponse {
  finalLeaderboard: any[];
  gameStats: {
    totalParticipants: number;
    totalQuestions: number;
    gameMode: string;
    duration: number;
  };
}

export interface ErrorResponse {
  message: string;
}

// Configuration du namespace
export const QUIZ_NAMESPACE = '/quiz';

// Configuration CORS pour le WebSocket
export const QUIZ_CORS_CONFIG = {
  origin: true,
  credentials: true,
};

// Timeouts et limites
export const QUIZ_LIMITS = {
  MAX_PLAYERS_PER_GAME: 50,
  MIN_PLAYERS_TO_START: 1,
  DEFAULT_QUESTION_TIME: 30, // secondes
  MAX_QUESTION_TIME: 120, // secondes
  MIN_QUESTION_TIME: 5, // secondes
  QUESTION_RESULTS_DISPLAY_TIME: 5000, // millisecondes
  GAME_START_DELAY: 3000, // millisecondes
} as const;

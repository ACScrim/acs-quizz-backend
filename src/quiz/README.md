# Quiz WebSocket Gateway

Ce fichier contient le gateway WebSocket pour gérer les quiz multijoueurs en temps réel. Il utilise Socket.IO pour la communication bidirectionnelle entre le serveur et les clients.

## Événements WebSocket

### Événements envoyés par le client

#### `authenticate`
Authentifie un utilisateur dans le système WebSocket.
```typescript
{
  userId: string
}
```

#### `join-game`
Permet à un utilisateur de rejoindre une session de quiz.
```typescript
{
  joinCode: string,
  userId: string
}
```

#### `leave-game`
Permet à un utilisateur de quitter une session de quiz.
```typescript
// Pas de données requises
```

#### `start-game`
Démarre une session de quiz (réservé à l'hôte).
```typescript
{
  gameSessionId: string
}
```

#### `answer-question`
Soumet une réponse à une question.
```typescript
{
  sessionQuestionId: string,
  selectedAnswer: string,
  responseTime: number // en millisecondes
}
```

#### `kick-player`
Expulse un joueur de la session (réservé à l'hôte).
```typescript
{
  gameSessionId: string,
  participantId: string
}
```

#### `get-game-state`
Demande l'état actuel du jeu.
```typescript
// Pas de données requises
```

#### `get-leaderboard`
Demande le classement actuel.
```typescript
// Pas de données requises
```

### Événements envoyés par le serveur

#### `authenticated`
Confirme l'authentification réussie.
```typescript
{
  success: boolean
}
```

#### `join-game-success`
Confirme que l'utilisateur a rejoint la session avec succès.
```typescript
{
  gameSession: GameSession,
  participant: Participant,
  gameState: GameState
}
```

#### `join-game-error`
Indique une erreur lors de la tentative de rejoindre une session.
```typescript
{
  message: string
}
```

#### `player-joined`
Notifie qu'un nouveau joueur a rejoint la session.
```typescript
{
  participant: Participant,
  totalPlayers: number
}
```

#### `player-disconnected`
Notifie qu'un joueur s'est déconnecté.
```typescript
{
  participantId: string,
  userId: string
}
```

#### `game-started`
Notifie que la session a commencé.
```typescript
{
  message: string,
  gameSessionId: string
}
```

#### `new-question`
Présente une nouvelle question aux participants.
```typescript
{
  sessionQuestion: {
    _id: string,
    order: number,
    presentedAt: Date,
    endsAt: Date
  },
  question: {
    _id: string,
    question: string,
    options: string[],
    difficulty: string,
    category: string
  },
  timeLimit: number,
  questionNumber: number,
  totalQuestions: number
}
```

#### `timer-update`
Met à jour le temps restant pour répondre à la question.
```typescript
{
  remainingTime: number // en secondes
}
```

#### `answer-submitted`
Confirme la soumission d'une réponse.
```typescript
{
  isCorrect: boolean,
  pointsAwarded: number,
  correctAnswer: string
}
```

#### `player-answered`
Notifie qu'un joueur a répondu à la question.
```typescript
{
  participantId: string,
  hasAnswered: boolean
}
```

#### `question-results`
Affiche les résultats d'une question après le timeout.
```typescript
{
  correctAnswer: string,
  answers: Array<{
    participantId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    responseTime: number,
    pointsAwarded: number
  }>,
  statistics: {
    totalAnswers: number,
    correctAnswers: number,
    incorrectAnswers: number,
    correctPercentage: number,
    averageResponseTime: number
  }
}
```

#### `leaderboard-update`
Met à jour le classement des joueurs.
```typescript
Array<{
  _id: string,
  score: number,
  userId: User,
  status: ParticipantStatus,
  lives?: number,
  rank?: number
}>
```

#### `player-eliminated`
Notifie qu'un joueur a été éliminé (mode Battle Royale).
```typescript
{
  message: string
}
```

#### `player-eliminated-broadcast`
Diffuse l'élimination d'un joueur à tous les participants.
```typescript
{
  participantId: string,
  username: string
}
```

#### `player-kicked`
Notifie qu'un joueur a été expulsé.
```typescript
{
  participantId: string,
  username: string
}
```

#### `kicked-from-game`
Notifie au joueur qu'il a été expulsé.
```typescript
{
  message: string
}
```

#### `game-ended`
Notifie la fin de la session de quiz.
```typescript
{
  finalLeaderboard: Array<Participant>,
  gameStats: {
    totalParticipants: number,
    totalQuestions: number,
    gameMode: GameModeType,
    duration: number // en millisecondes
  }
}
```

#### `game-state`
Retourne l'état actuel du jeu.
```typescript
{
  gameSession: GameSession,
  participants: Participant[],
  currentQuestion?: SessionQuestion,
  scores: Participant[]
}
```

#### `leaderboard`
Retourne le classement des joueurs.
```typescript
Array<Participant>
```

#### `error`
Indique une erreur générale.
```typescript
{
  message: string
}
```

## Modes de jeu supportés

### POINTS
Mode classique où les joueurs accumulent des points :
- Points fixes pour les bonnes réponses
- Bonus de vitesse optionnel
- Pas d'élimination

### BATTLE_ROYALE
Mode où les joueurs ont des vies limitées :
- Les mauvaises réponses font perdre une vie
- Élimination quand les vies atteignent zéro
- Dernier joueur debout gagne

## Fonctionnalités

- **Authentification** : Système d'authentification des utilisateurs
- **Gestion des sessions** : Création, rejoindre, quitter des sessions
- **Temps réel** : Questions présentées en temps réel avec timer
- **Classements** : Mise à jour en temps réel des scores
- **Modes de jeu** : Support de différents modes (Points, Battle Royale)
- **Administration** : L'hôte peut expulser des joueurs
- **Statistiques** : Calcul de statistiques par question et par session
- **Gestion des déconnexions** : Reconnexion automatique possible
- **Namespace** : Utilise le namespace `/quiz` pour isoler les événements

## Utilisation côté client

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/quiz');

// Authentification
socket.emit('authenticate', { userId: 'user123' });

// Rejoindre une session
socket.emit('join-game', { 
  joinCode: 'ABC123', 
  userId: 'user123' 
});

// Écouter les événements
socket.on('new-question', (questionData) => {
  console.log('Nouvelle question:', questionData);
});

socket.on('timer-update', (data) => {
  console.log('Temps restant:', data.remainingTime);
});

// Répondre à une question
socket.emit('answer-question', {
  sessionQuestionId: 'question123',
  selectedAnswer: 'Option A',
  responseTime: 3500
});
```

## Configuration requise

- MongoDB pour la persistance des données
- Socket.IO pour les WebSockets
- NestJS avec les modules appropriés importés dans QuizModule

## Sécurité

- Vérification des permissions (seul l'hôte peut démarrer/expulser)
- Validation des données d'entrée
- Gestion des erreurs appropriée
- Namespace isolé pour les événements de quiz

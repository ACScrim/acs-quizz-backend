# Référence Complète des Événements WebSocket - Quiz Multijoueur

## Vue d'ensemble
Ce gateway WebSocket gère tous les événements nécessaires pour faire fonctionner un quiz multijoueur en temps réel. Il supporte deux modes de jeu : **Points** (classique) et **Battle Royale** (avec élimination).

## Événements par Catégorie

### 🔐 Authentification

| Événement | Direction | Description | Données |
|-----------|-----------|-------------|---------|
| `authenticate` | Client → Serveur | Authentifie un utilisateur | `{ userId: string }` |
| `authenticated` | Serveur → Client | Confirme l'authentification | `{ success: boolean }` |

### 🎮 Gestion des Sessions

| Événement | Direction | Description | Données |
|-----------|-----------|-------------|---------|
| `join-game` | Client → Serveur | Rejoindre une session | `{ joinCode: string, userId: string }` |
| `join-game-success` | Serveur → Client | Confirmation de participation | `{ gameSession, participant, gameState }` |
| `join-game-error` | Serveur → Client | Erreur lors de la participation | `{ message: string }` |
| `leave-game` | Client → Serveur | Quitter une session | (aucune donnée) |
| `start-game` | Client → Serveur | Démarrer la session (hôte) | `{ gameSessionId: string }` |
| `game-started` | Serveur → Tous | Notification de début | `{ message: string, gameSessionId: string }` |
| `game-ended` | Serveur → Tous | Notification de fin | `{ finalLeaderboard, gameStats }` |

### 👥 Gestion des Joueurs

| Événement | Direction | Description | Données |
|-----------|-----------|-------------|---------|
| `player-joined` | Serveur → Autres | Nouveau joueur rejoint | `{ participant, totalPlayers }` |
| `player-disconnected` | Serveur → Autres | Joueur déconnecté | `{ participantId, userId }` |
| `kick-player` | Client → Serveur | Expulser un joueur (hôte) | `{ gameSessionId, participantId }` |
| `player-kicked` | Serveur → Autres | Joueur expulsé | `{ participantId, username }` |
| `kicked-from-game` | Serveur → Joueur | Notification d'expulsion | `{ message: string }` |

### ❓ Questions et Réponses

| Événement | Direction | Description | Données |
|-----------|-----------|-------------|---------|
| `new-question` | Serveur → Tous | Nouvelle question présentée | `{ sessionQuestion, question, timeLimit, questionNumber, totalQuestions }` |
| `timer-update` | Serveur → Tous | Mise à jour du timer | `{ remainingTime: number }` |
| `answer-question` | Client → Serveur | Soumettre une réponse | `{ sessionQuestionId, selectedAnswer, responseTime }` |
| `answer-submitted` | Serveur → Client | Confirmation de réponse | `{ isCorrect, pointsAwarded, correctAnswer }` |
| `player-answered` | Serveur → Autres | Joueur a répondu | `{ participantId, hasAnswered }` |
| `question-results` | Serveur → Tous | Résultats de la question | `{ correctAnswer, answers, statistics }` |

### 🏆 Classements et État

| Événement | Direction | Description | Données |
|-----------|-----------|-------------|---------|
| `get-leaderboard` | Client → Serveur | Demander le classement | (aucune donnée) |
| `leaderboard` | Serveur → Client | Classement actuel | `Array<Participant>` |
| `leaderboard-update` | Serveur → Tous | Mise à jour du classement | `Array<Participant>` |
| `get-game-state` | Client → Serveur | Demander l'état du jeu | (aucune donnée) |
| `game-state` | Serveur → Client | État actuel du jeu | `{ gameSession, participants, currentQuestion, scores }` |

### ⚔️ Mode Battle Royale

| Événement | Direction | Description | Données |
|-----------|-----------|-------------|---------|
| `player-eliminated` | Serveur → Joueur | Notification d'élimination | `{ message: string }` |
| `player-eliminated-broadcast` | Serveur → Autres | Diffusion d'élimination | `{ participantId, username }` |

### ❌ Gestion d'Erreurs

| Événement | Direction | Description | Données |
|-----------|-----------|-------------|---------|
| `error` | Serveur → Client | Erreur générale | `{ message: string }` |

## Flux de Jeu Typique

### 1. Connexion et Authentification
```
Client connecte → authenticate → authenticated
```

### 2. Rejoindre une Session
```
join-game → join-game-success → player-joined (broadcast)
```

### 3. Démarrage du Jeu
```
start-game (hôte) → game-started (broadcast) → new-question (broadcast)
```

### 4. Cycle de Questions
```
new-question → timer-update (chaque seconde) → answer-question → answer-submitted
```

### 5. Résultats et Prochaine Question
```
(timeout) → question-results → leaderboard-update → new-question (ou game-ended)
```

## Structures de Données Détaillées

### GameSession
```typescript
{
  _id: string,
  joinCode: string,
  status: GameSessionStatus,
  gameMode: GameModeType,
  host: User,
  maxPlayers: number,
  timePerQuestion: number,
  numberOfQuestions: number,
  currentQuestionIndex: number,
  selectedCategories: string[],
  participants: string[]
}
```

### Participant
```typescript
{
  _id: string,
  userId: User,
  gameSessionId: string,
  status: ParticipantStatus,
  score: number,
  lives?: number,
  rank?: number,
  joinedAt: Date
}
```

### Question Data (dans new-question)
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

### Question Statistics
```typescript
{
  totalAnswers: number,
  correctAnswers: number,
  incorrectAnswers: number,
  correctPercentage: number,
  averageResponseTime: number
}
```

### Game Statistics
```typescript
{
  totalParticipants: number,
  totalQuestions: number,
  gameMode: GameModeType,
  duration: number // millisecondes
}
```

## Codes d'État et Énumérations

### GameSessionStatus
- `WAITING` : En attente de joueurs
- `IN_PROGRESS` : Jeu en cours
- `COMPLETED` : Jeu terminé
- `CANCELLED` : Jeu annulé

### ParticipantStatus
- `ACTIVE` : Participant actif
- `ELIMINATED` : Éliminé (Battle Royale)
- `DISCONNECTED` : Déconnecté

### GameModeType
- `POINTS` : Mode classique à points
- `BATTLE_ROYALE` : Mode avec élimination

## Gestion des Erreurs

### Erreurs Communes
| Message | Cause | Solution |
|---------|-------|----------|
| "User not authenticated" | Événement sans authentification | Appeler `authenticate` d'abord |
| "Game session not found" | Code de session invalide | Vérifier le code |
| "Game session is not accepting new players" | Session commencée/complète | Rejoindre une autre session |
| "Only the host can start the game" | Non-hôte tente de démarrer | Seul l'hôte peut démarrer |
| "Participant not active" | Participant éliminé/déconnecté | Réactiver le participant |
| "Already answered this question" | Réponse déjà soumise | Attendre la prochaine question |

## Bonnes Pratiques

### Côté Client
1. **Toujours s'authentifier** avant d'utiliser d'autres événements
2. **Gérer les déconnexions** avec reconnexion automatique
3. **Valider les données** avant envoi
4. **Écouter les erreurs** et les gérer appropriément
5. **Nettoyer les timers** côté client à la déconnexion

### Côté Serveur
- Le gateway gère automatiquement la validation et la sécurité
- Les timers sont nettoyés automatiquement
- Les déconnexions sont gérées gracieusement
- Les données sont persistées en base de données

## Limites et Configuration

### Limites par Défaut
- **Joueurs max par session** : 50
- **Temps par question** : 5-120 secondes
- **Délai d'affichage des résultats** : 5 secondes
- **Délai de démarrage** : 3 secondes

Ces limites peuvent être configurées dans `quiz.constants.ts`.

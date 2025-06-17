export enum GameSessionStatus {
  WAITING, // La session est créée, en attente de joueurs ou du démarrage par l'hôte
  IN_PROGRESS, // Le quiz est en cours
  COMPLETED, // Le quiz est terminé, les scores sont finaux
  CANCELLED // La session a été annulée par l'hôte ou un problème
}

export enum GameModeType {
  POINTS, // Jeu classique basé sur l'accumulation de points
  BATTLE_ROYALE // Jeu où les joueurs ont des vies et sont éliminés
}

export enum ParticipantStatus {
  ACTIVE, // Le participant est actif dans le jeu
  ELIMINATED, // Le participant a été éliminé (ex: plus de vies en Battle Royale)
  DISCONNECTED // Le participant s'est déconnecté
}
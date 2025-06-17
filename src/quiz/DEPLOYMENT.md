# Guide de Déploiement - Quiz WebSocket Gateway

## Prérequis

### Dépendances
Assurez-vous que les packages suivants sont installés :
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### Base de données
- MongoDB en fonctionnement
- Base de données `acs-quizz` créée
- Collections pour les entités existantes

## Installation

### 1. Importer le module dans votre application
```typescript
// app.module.ts
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [
    // ... autres modules
    QuizModule,
  ],
  // ...
})
export class AppModule {}
```

### 2. Configurer les schémas Mongoose
Assurez-vous que tous les schémas sont correctement exportés dans leurs modules respectifs :
- GameSessionSchema
- ParticipantSchema
- SessionQuestionSchema
- ParticipantAnswerSchema
- QuestionSchema
- UserSchema

### 3. Configuration CORS (optionnel)
Si votre frontend est sur un domaine différent, configurez CORS dans main.ts :
```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:3000', 'https://votredomaine.com'],
    credentials: true,
  });
  
  await app.listen(3000);
}
bootstrap();
```

## Démarrage

### Démarrage en développement
```bash
npm run start:dev
```

### Démarrage en production
```bash
npm run build
npm run start:prod
```

## Test de connexion

### Test simple avec curl (WebSocket handshake)
```bash
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Host: localhost:3000" \
     -H "Origin: http://localhost:3000" \
     http://localhost:3000/socket.io/?EIO=4&transport=polling
```

### Test avec un client JavaScript simple
```html
<!DOCTYPE html>
<html>
<head>
    <title>Quiz WebSocket Test</title>
</head>
<body>
    <script src="https://cdn.socket.io/4.7.1/socket.io.min.js"></script>
    <script>
        const socket = io('http://localhost:3000/quiz');
        
        socket.on('connect', () => {
            console.log('Connecté au serveur');
            
            // Test d'authentification
            socket.emit('authenticate', { userId: 'test-user-123' });
        });
        
        socket.on('authenticated', (data) => {
            console.log('Authentifié:', data);
        });
        
        socket.on('error', (error) => {
            console.error('Erreur:', error);
        });
    </script>
</body>
</html>
```

## Configuration de production

### Variables d'environnement
Créez un fichier `.env` avec les variables suivantes :
```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/acs-quizz

# Configuration du serveur
PORT=3000
NODE_ENV=production

# CORS (optionnel)
CORS_ORIGIN=https://votredomaine.com

# Limites (optionnel)
MAX_PLAYERS_PER_GAME=50
DEFAULT_QUESTION_TIME=30
```

### Configuration avec Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  quiz-backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/acs-quizz
    depends_on:
      - mongo
    
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Déploiement avec PM2
```bash
# Installation de PM2
npm install -g pm2

# Fichier ecosystem.config.js
module.exports = {
  apps: [{
    name: 'quiz-backend',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://localhost:27017/acs-quizz'
    }
  }]
};

# Démarrage
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Monitoring et Logs

### Logs des WebSockets
Les logs sont automatiquement générés par le gateway. Pour les consulter :
```bash
# En développement
tail -f logs/application.log

# Avec PM2
pm2 logs quiz-backend
```

### Métriques importantes à surveiller
- Nombre de connexions WebSocket actives
- Nombre de sessions de jeu en cours
- Temps de réponse des questions
- Taux d'erreurs de connexion

### Configuration de logging avancé (optionnel)
```typescript
// logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'logs/quiz-gateway.log',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});
```

## Sécurité

### Protection contre les attaques DDoS
```typescript
// main.ts
import rateLimit from 'express-rate-limit';

const app = await NestFactory.create(AppModule);

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
}));
```

### Validation des entrées
Utilisez des pipes de validation pour tous les événements WebSocket :
```typescript
import { IsString, IsNumber, Min } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  sessionQuestionId: string;

  @IsString()
  selectedAnswer: string;

  @IsNumber()
  @Min(0)
  responseTime: number;
}
```

### Configuration HTTPS (production)
```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name votredomaine.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Dépannage

### Problèmes courants

#### Connexion WebSocket échoue
- Vérifiez que le port 3000 est ouvert
- Vérifiez la configuration CORS
- Vérifiez les logs du serveur

#### Base de données inaccessible
- Vérifiez que MongoDB est démarré
- Vérifiez l'URI de connexion
- Vérifiez les permissions de la base de données

#### Performances dégradées
- Surveillez l'utilisation CPU/mémoire
- Vérifiez le nombre de connexions actives
- Optimisez les requêtes MongoDB

### Commandes de diagnostic
```bash
# Vérifier les connexions WebSocket
netstat -an | grep :3000

# Vérifier les processus Node.js
ps aux | grep node

# Vérifier l'utilisation de la mémoire
free -h

# Logs MongoDB
tail -f /var/log/mongodb/mongod.log
```

## Sauvegarde et restauration

### Sauvegarde de la base de données
```bash
mongodump --db acs-quizz --out /backup/$(date +%Y%m%d)
```

### Restauration
```bash
mongorestore --db acs-quizz /backup/20231201/acs-quizz
```

## Mise à jour

### Procédure de mise à jour
1. Arrêter le service
2. Sauvegarder la base de données
3. Déployer la nouvelle version
4. Tester les connexions
5. Redémarrer le service

```bash
# Script de mise à jour
#!/bin/bash
pm2 stop quiz-backend
mongodump --db acs-quizz --out /backup/$(date +%Y%m%d)
npm run build
pm2 start quiz-backend
pm2 logs quiz-backend --lines 50
```

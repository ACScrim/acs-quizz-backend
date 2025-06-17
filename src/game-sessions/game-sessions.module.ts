import { Module } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { GameSessionsController } from './game-sessions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GameSession, GameSessionSchema } from './entities/game-session.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameSession.name, schema: GameSessionSchema },
    ]),
  ],
  controllers: [GameSessionsController],
  providers: [GameSessionsService],
  exports: [MongooseModule]
})
export class GameSessionsModule {}

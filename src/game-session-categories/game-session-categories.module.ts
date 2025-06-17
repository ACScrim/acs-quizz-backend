import { Module } from '@nestjs/common';
import { GameSessionCategoriesService } from './game-session-categories.service';
import { GameSessionCategoriesController } from './game-session-categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GameSession } from 'src/game-sessions/entities/game-session.entity';
import { GameSessionCategory, GameSessionCategorySchema } from './entities/game-session-category.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameSessionCategory.name, schema: GameSessionCategorySchema },
    ]),
  ],
  controllers: [GameSessionCategoriesController],
  providers: [GameSessionCategoriesService],
})
export class GameSessionCategoriesModule {}

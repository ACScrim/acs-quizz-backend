import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { Quiz, QuizSchema } from './entities/quiz.entity';
import { GAMEMODES } from './gamemodes';
import { QuizPointsSchema } from './entities/quiz.points.entity';
import { QuizBattleRoyalSchema } from './entities/quiz.battleroyal.entity';
import { LobbiesModule } from 'src/lobbies/lobbies.module';
import { QuestionsModule } from 'src/questions/questions.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Quiz.name,
        useFactory: () => {
          const schema = QuizSchema;
          schema.discriminator(GAMEMODES.POINTS, QuizPointsSchema);
          schema.discriminator(GAMEMODES.BATTLEROYAL, QuizBattleRoyalSchema);
          return schema;
        }
      }
    ]),
    LobbiesModule,
    QuestionsModule
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}

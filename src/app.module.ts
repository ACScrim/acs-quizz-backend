import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CronsModule } from './crons/crons.module';
import { LobbiesGateway } from './gateways/game.points/lobbies.gateway';
import { LobbiesModule } from './lobbies/lobbies.module';
import { QuestionCategoriesModule } from './question-categories/question-categories.module';
import { QuestionTypesModule } from './question-type/question-types.module';
import { QuestionsModule } from './questions/questions.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { UserAnswersModule } from './user-answers/user-answers.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/acs-quizz'),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    QuestionsModule,
    QuestionTypesModule,
    QuestionCategoriesModule,
    UserAnswersModule,
    UsersModule,
    LobbiesModule,
    CronsModule,
    AuthModule,
    QuizzesModule,
  ],
  controllers: [AppController],
  providers: [AppService, LobbiesGateway],
})
export class AppModule {}

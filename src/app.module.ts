import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CronsModule } from './crons/crons.module';
import { GameSessionCategoriesModule } from './game-session-categories/game-session-categories.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { ParticipantAnswersModule } from './participant-answers/participant-answers.module';
import { ParticipantsModule } from './participants/participants.module';
import { QuestionCategoriesModule } from './question-categories/question-categories.module';
import { QuestionTypesModule } from './question-type/question-types.module';
import { QuestionsModule } from './questions/questions.module';
import { SessionQuestionsModule } from './session-questions/session-questions.module';
import { UsersModule } from './users/users.module';
import { QuizModule } from './quiz/quiz.module';

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
    UsersModule,
    CronsModule,
    AuthModule,
    GameSessionsModule,
    GameSessionCategoriesModule,
    SessionQuestionsModule,
    ParticipantsModule,
    ParticipantAnswersModule,
    QuizModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

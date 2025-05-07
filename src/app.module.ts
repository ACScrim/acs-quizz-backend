import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CronsModule } from './crons/crons.module';
import { LobbiesModule } from './lobbies/lobbies.module';
import { QuestionCategoriesModule } from './question-categories/question-categories.module';
import { QuestionTypesModule } from './question-type/question-types.module';
import { QuestionsModule } from './questions/questions.module';
import { TestWsGateway } from './test-ws/test-ws.gateway';
import { UserAnswersModule } from './user-answers/user-answers.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { QuizzesModule } from './quizzes/quizzes.module';

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
  providers: [AppService, TestWsGateway],
})
export class AppModule {}

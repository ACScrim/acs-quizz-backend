import { Module } from '@nestjs/common';
import { QuizGateway } from './quiz.gateway';
import { GameSessionsModule } from '../game-sessions/game-sessions.module';
import { ParticipantsModule } from '../participants/participants.module';
import { SessionQuestionsModule } from '../session-questions/session-questions.module';
import { ParticipantAnswersModule } from '../participant-answers/participant-answers.module';
import { AuthModule } from '../auth/auth.module';
import { QuestionsModule } from 'src/questions/questions.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    GameSessionsModule,
    ParticipantsModule,
    SessionQuestionsModule,
    ParticipantAnswersModule,
    AuthModule,
    QuestionsModule,
    UsersModule
  ],
  providers: [QuizGateway],
  exports: [QuizGateway],
})
export class QuizModule {}

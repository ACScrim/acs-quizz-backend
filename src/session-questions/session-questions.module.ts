import { Module } from '@nestjs/common';
import { SessionQuestionsService } from './session-questions.service';
import { SessionQuestionsController } from './session-questions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionQuestion, SessionQuestionSchema } from './entities/session-question.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SessionQuestion.name, schema: SessionQuestionSchema },
    ]),
  ],
  controllers: [SessionQuestionsController],
  providers: [SessionQuestionsService],
  exports: [MongooseModule]
})
export class SessionQuestionsModule { }

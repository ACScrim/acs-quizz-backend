import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question, QuestionSchema } from './entities/question.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionCategoriesModule } from 'src/question-categories/question-categories.module';
import { QuestionTypesModule } from 'src/question-type/question-types.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
    QuestionCategoriesModule,
    QuestionTypesModule
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}

import { Module } from '@nestjs/common';
import { QuestionTypeService } from './question-type.service';
import { QuestionTypeController } from './question-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QuestionType,
  QuestionTypeSchema,
} from './entities/question-type.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionType.name, schema: QuestionTypeSchema },
    ]),
  ],
  controllers: [QuestionTypeController],
  providers: [QuestionTypeService],
})
export class QuestionTypeModule {}

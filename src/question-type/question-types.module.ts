import { Module } from '@nestjs/common';
import { QuestionTypesService } from './question-types.service';
import { QuestionTypesController } from './question-types.controller';
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
  controllers: [QuestionTypesController],
  providers: [QuestionTypesService],
})
export class QuestionTypesModule {}

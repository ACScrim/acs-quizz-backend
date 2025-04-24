import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { QuestionType } from 'src/question-type/entities/question-type.entity';
@Schema()
export class Question {
  @Prop()
  question: string;

  @Prop()
  answer: string;

  @Prop()
  options: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionType' })
  questionType: QuestionType;

  @Prop()
  questionCategory: string;

  @Prop()
  questionDifficulty: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

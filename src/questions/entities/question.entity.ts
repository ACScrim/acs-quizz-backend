import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { QuestionCategory } from 'src/question-categories/entities/question-category.entity';
import { QuestionType } from 'src/question-type/entities/question-type.entity';
@Schema()
export class Question extends mongoose.Document {
  @Prop()
  question: string;

  @Prop()
  answer: string;

  @Prop()
  options: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionType' })
  type: QuestionType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionCategory' })
  category: QuestionCategory;

  @Prop()
  difficulty: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SessionQuestion' }] })
  sessionQuestions: mongoose.Schema.Types.ObjectId[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

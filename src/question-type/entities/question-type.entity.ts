import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class QuestionType {
  @Prop()
  type: string;
}

export const QuestionTypeSchema = SchemaFactory.createForClass(QuestionType);

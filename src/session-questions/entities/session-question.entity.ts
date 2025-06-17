import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
@Schema()
export class SessionQuestion extends mongoose.Document {
  @Prop()
  order: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' })
  gameSessionId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Question' })
  questionId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: Date })
  presentedAt: Date;

  @Prop({ type: Date })
  endsAt: Date;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ParticipantAnswer' }] })
  participantsAnswers: mongoose.Schema.Types.ObjectId[];
}

export const SessionQuestionSchema = SchemaFactory.createForClass(SessionQuestion);

SessionQuestionSchema.index({ gameSessionId: 1, order: 1 }, { unique: true });
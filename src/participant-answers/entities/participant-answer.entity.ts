import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ParticipantStatus } from 'src/types';
@Schema()
export class ParticipantAnswer extends mongoose.Document {
  @Prop({ type: Date, default: Date.now })
  answeredAt: Date;

  @Prop()
  responseTime?: number;

  @Prop({ default: 0 })
  pointsAwarded: number;

  @Prop()
  isCorrect?: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' })
  participantId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SessionQuestion' })
  sessionQuestionId: mongoose.Schema.Types.ObjectId;

  @Prop()
  selectedAnswer?: string;
}

export const ParticipantAnswerSchema = SchemaFactory.createForClass(ParticipantAnswer);

ParticipantAnswerSchema.index({ participantId: 1, sessionQuestionId: 1 }, { unique: true });
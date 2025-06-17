import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ParticipantStatus } from 'src/types';
@Schema()
export class Participant extends mongoose.Document {
  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  @Prop()
  status: ParticipantStatus;

  @Prop({ default: 0 })
  score: number;

  @Prop()
  lives?: number;

  @Prop()
  rank?: number

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' })
  gameSessionId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ParticipantAnswer' }] })
  answers: mongoose.Schema.Types.ObjectId[];
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

ParticipantSchema.index({ userId: 1, gameSessionId: 1 }, { unique: true });
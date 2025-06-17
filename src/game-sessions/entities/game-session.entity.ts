import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { GameModeType, GameSessionStatus } from 'src/types';
import { User } from 'src/users/entities/user.entity';
@Schema()
export class GameSession extends mongoose.Document {
  @Prop()
  joinCode: string;

  @Prop({ default: GameSessionStatus.WAITING })
  status: GameSessionStatus;

  @Prop()
  gameMode: GameModeType;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  endedAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User'})
  host: User;

  @Prop({ default: 10 })
  maxPlayers: number;

  @Prop({ default: 5 })
  timePerQuestion: number;

  @Prop({ default: 50 })
  numberOfQuestions: number;

  @Prop()
  initialLives?: number;

  @Prop()
  pointsForCorrect?: number;

  @Prop()
  pointsForSpeed?: number;

  @Prop()
  currentQuestionIndex: number;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GameSessionCategory' }] })
  selectedCategories: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SessionQuestion' }] })
  sessionQuestions: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }] })
  participants: mongoose.Schema.Types.ObjectId[];
}

export const GameSessionSchema = SchemaFactory.createForClass(GameSession);

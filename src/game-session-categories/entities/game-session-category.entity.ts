import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
@Schema()
export class GameSessionCategory extends mongoose.Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' })
  gameSessionId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionCategory' })
  categoryId: mongoose.Schema.Types.ObjectId;
}

export const GameSessionCategorySchema = SchemaFactory.createForClass(GameSessionCategory);

GameSessionCategorySchema.index({ gameSessionId: 1, categoryId: 1 }, { unique: true });
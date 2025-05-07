import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Quiz } from "./quiz.entity";

@Schema()
export class QuizBattleRoyal extends Quiz {
    @Prop()
    maxLives: number;

    @Prop({ type: Map, of: Number })
    playerLives: Record<string, number>; // playerId -> lives
}

export const QuizBattleRoyalSchema = SchemaFactory.createForClass(QuizBattleRoyal);
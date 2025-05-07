import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Quiz } from "./quiz.entity";

@Schema()
export class QuizPoints extends Quiz {
    @Prop()
    pointsToReach: number;

    @Prop({ type: Map, of: Number })
    playerPoints: Record<string, number>; // playerId -> points
}

export const QuizPointsSchema = SchemaFactory.createForClass(QuizPoints);
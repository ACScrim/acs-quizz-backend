import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Question } from "src/questions/entities/question.entity";

@Schema()
export class UserAnswer {
    @Prop()
    user: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Question' })
    question: Question;

    @Prop()
    answer: string;
}

export const UserAnswerSchema = SchemaFactory.createForClass(UserAnswer);
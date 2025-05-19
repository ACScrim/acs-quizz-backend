import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Lobby } from "src/lobbies/entities/lobby.entity";
import { Question } from "src/questions/entities/question.entity";

@Schema({ _id: true, timestamps: true })
export class Quiz extends mongoose.Document {
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }] })
    questions: Question[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Lobby" })
    lobby: Lobby;

    @Prop({ discriminator: true })
    gameMode: string; // One value from the GAMEMODES enum

    @Prop({ type: Number, default: 0 })
    questionIndex: number; // Index of the current question
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
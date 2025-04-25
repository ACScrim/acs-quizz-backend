import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { User } from "src/users/entities/user.entity";

@Schema({ timestamps: true })
export class Lobby {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    isPublic: boolean;

    @Prop({ required: true, unique: true })
    code: string;

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: "User" })
    owner: User;

    @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "User" })
    players: User[];
}

export const LobbySchema = SchemaFactory.createForClass(Lobby);


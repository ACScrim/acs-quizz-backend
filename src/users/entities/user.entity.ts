import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class User extends Document {
    @Prop({ unique: true })
    discordId: string;

    @Prop()
    username: string;

    @Prop()
    avatar: string;

    @Prop()
    accessToken: string;

    @Prop()
    refreshToken: string;

    @Prop()
    expiresAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
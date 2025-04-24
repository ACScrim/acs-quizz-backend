import { SchemaFactory } from "@nestjs/mongoose";

export class User {}

export const UserSchema = SchemaFactory.createForClass(User);
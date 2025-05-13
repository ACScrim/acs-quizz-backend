import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    return {
      discordId: ret.discordId,
      username: ret.username,
      avatar: ret.avatar,
    };
  },
});

export { UserSchema };

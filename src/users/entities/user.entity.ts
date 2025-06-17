import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ unique: true })
  discordId: string;

  @Prop()
  username: string;

  @Prop()
  avatar: string;

  @Prop()
  discordAccessToken: string;

  @Prop()
  discordRefreshToken: string;

  @Prop()
  refreshToken: string;

  @Prop()
  accessToken: string;

  @Prop()
  expiresAt: Date;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' }] })
  hostedSessions: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }] })
  participations: mongoose.Schema.Types.ObjectId[];
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    return {
      id: ret._id,
      discordId: ret.discordId,
      username: ret.username,
      avatar: ret.avatar,
      refreshToken: ret.refreshToken,
      accessToken: ret.accessToken
    };
  },
});

export { UserSchema };

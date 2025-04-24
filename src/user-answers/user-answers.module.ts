import { Module } from '@nestjs/common';
import { UserAnswersService } from './user-answers.service';
import { UserAnswersController } from './user-answers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAnswer, UserAnswerSchema } from './entities/user-answer.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAnswer.name, schema: UserAnswerSchema },
    ]),
  ],
  controllers: [UserAnswersController],
  providers: [UserAnswersService],
})
export class UserAnswersModule {}

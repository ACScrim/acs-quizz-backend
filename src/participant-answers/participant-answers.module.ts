import { Module } from '@nestjs/common';
import { ParticipantAnswersService } from './participant-answers.service';
import { ParticipantAnswersController } from './participant-answers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ParticipantAnswer, ParticipantAnswerSchema } from './entities/participant-answer.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParticipantAnswer.name, schema: ParticipantAnswerSchema },
    ]),
  ],
  controllers: [ParticipantAnswersController],
  providers: [ParticipantAnswersService],
  exports: [MongooseModule]
})
export class ParticipantAnswersModule {}

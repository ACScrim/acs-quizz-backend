import { Controller } from '@nestjs/common';
import { ParticipantAnswersService } from './participant-answers.service';

@Controller('participant-answers')
export class ParticipantAnswersController {
  constructor(private readonly participantAnswersService: ParticipantAnswersService) {}
}

import { Controller } from '@nestjs/common';
import { SessionQuestionsService } from './session-questions.service';

@Controller('session-questions')
export class SessionQuestionsController {
  constructor(private readonly sessionQuestionsService: SessionQuestionsService) {}
}

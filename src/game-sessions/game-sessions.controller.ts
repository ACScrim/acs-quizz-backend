import { Controller } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';

@Controller('game-sessions')
export class GameSessionsController {
  constructor(private readonly gameSessionsService: GameSessionsService) {}
}

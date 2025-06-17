import { Controller } from '@nestjs/common';
import { GameSessionCategoriesService } from './game-session-categories.service';

@Controller('game-session-categories')
export class GameSessionCategoriesController {
  constructor(private readonly gameSessionCategoriesService: GameSessionCategoriesService) {}
}

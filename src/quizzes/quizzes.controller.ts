import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { GAMEMODES } from './gamemodes';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get('gamemodes')
  getGameModes() {
    return Object.values(GAMEMODES);
  }

  @Post()
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.create(createQuizDto);
  }

  @Get('/lobby/:lobbyId')
  getQuizzForLobby(@Param('lobbyId') lobbyId: string) {
    return this.quizzesService.getQuizzForLobby(lobbyId);
  }
}

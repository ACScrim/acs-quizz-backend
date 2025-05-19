import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lobby } from 'src/lobbies/entities/lobby.entity';
import { Question } from 'src/questions/entities/question.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizBattleRoyal } from './entities/quiz.battleroyal.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizPoints } from './entities/quiz.points.entity';
import { GAMEMODES } from './gamemodes';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @InjectModel(Lobby.name) private readonly lobbyModel: Model<Lobby>,
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
  ) {}

  async create(createQuizDto: CreateQuizDto) {
    const discriminatorModel =
      this.quizModel.discriminators?.[createQuizDto.gameMode];
    if (discriminatorModel) {
      const lobby = await this.lobbyModel
        .findById(createQuizDto.lobby)
        .populate('players');
      if (!lobby) {
        throw new Error('Lobby not found');
      }
      createQuizDto.questions = await this.createQuestionsArray(50);
      switch (createQuizDto.gameMode) {
        case GAMEMODES.POINTS:
          createQuizDto.playerPoints = {};
          lobby.players.forEach((player) => {
            createQuizDto.playerPoints![player.id] = 0;
          });
          break;
        case GAMEMODES.BATTLEROYAL:
          createQuizDto.playerLives = {};
          lobby.players.forEach((player) => {
            createQuizDto.playerLives![player.id] = createQuizDto.maxLives!;
          });
          break;
      }

      return discriminatorModel.create(createQuizDto);
    }
    // Fallback sur le modèle de base si pas de discriminator trouvé
    return this.quizModel.create(createQuizDto);
  }

  async getQuizzForLobby(lobbyId: string) {
    return await this.quizModel.findOne({ lobby: lobbyId }).exec();
  }

  private async createQuestionsArray(numberOfQuestions: number) {
    const questions: Question[] = [];
    while (questions.length < numberOfQuestions) {
      const question = await this.questionModel
        .findOne()
        .skip(
          Math.floor(
            Math.random() * (await this.questionModel.countDocuments()),
          ),
        )
        .exec();
      if (!question) {
        throw new Error('Question not found');
      }
      if (questions.some((q) => q.id.toString() === question.id.toString())) {
        continue; // Skip if question already exists in the array
      }
      questions.push(question);
    }
    return questions;
  }

  async updatePlayersPoints(
    quiz: QuizPoints,
    newPlayerPoints: Record<string, number>,
  ) {
    quiz.playerPoints = newPlayerPoints;
    await this.quizModel
      .updateOne({ _id: quiz.id }, { playerPoints: newPlayerPoints })
      .exec();
  }

  async updatePlayersLives(
    quiz: QuizBattleRoyal,
    newPlayerLives: Record<string, number>,
  ) {
    quiz.playerLives = newPlayerLives;
    await this.quizModel
      .updateOne({ _id: quiz.id }, { playerLives: newPlayerLives })
      .exec();
  }
}

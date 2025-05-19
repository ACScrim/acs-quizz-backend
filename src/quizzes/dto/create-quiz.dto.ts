import { IsArray, IsEnum, IsNumber, IsObject, IsPositive, IsString, ValidateIf } from 'class-validator';
import { Question } from 'src/questions/entities/question.entity';
import { GAMEMODES } from '../gamemodes';


export class CreateQuizDto {
  @IsArray()
  @IsObject({ each: true })
  questions: Question[];

  @IsString()
  lobby: string; // Lobby ID as a string

  @IsEnum(GAMEMODES)
  gameMode: string; // Discriminator key

  @ValidateIf(o => o.gameMode === GAMEMODES.POINTS)
  @IsNumber()
  @IsPositive()
  pointsToReach?: number;

  @ValidateIf(o => o.gameMode === GAMEMODES.BATTLEROYAL)
  @IsNumber()
  @IsPositive()
  maxLives?: number;

  playerPoints?: Record<string, number>; // Only for POINTS mode, to track player points
  playerLives?: Record<string, number>; // Only for BATTLEROYAL mode, to track player lives
}

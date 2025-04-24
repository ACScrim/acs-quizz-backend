import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionTypeDto } from './create-question-types.dto';

export class UpdateQuestionTypeDto extends PartialType(CreateQuestionTypeDto) {}

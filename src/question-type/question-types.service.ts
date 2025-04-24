import { Injectable } from '@nestjs/common';
import { CreateQuestionTypeDto } from './dto/create-question-types.dto';
import { UpdateQuestionTypeDto } from './dto/update-question-types.dto';

@Injectable()
export class QuestionTypesService {
  create(createQuestionTypeDto: CreateQuestionTypeDto) {
    return 'This action adds a new questionType';
  }

  findAll() {
    return `This action returns all questionType`;
  }

  findOne(id: number) {
    return `This action returns a #${id} questionType`;
  }

  update(id: number, updateQuestionTypeDto: UpdateQuestionTypeDto) {
    return `This action updates a #${id} questionType`;
  }

  remove(id: number) {
    return `This action removes a #${id} questionType`;
  }
}

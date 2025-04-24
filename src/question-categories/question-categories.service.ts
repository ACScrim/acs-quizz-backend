import { Injectable } from '@nestjs/common';
import { CreateQuestionCategoryDto } from './dto/create-question-category.dto';
import { UpdateQuestionCategoryDto } from './dto/update-question-category.dto';

@Injectable()
export class QuestionCategoriesService {
  create(createQuestionCategoryDto: CreateQuestionCategoryDto) {
    return 'This action adds a new questionCategory';
  }

  findAll() {
    return `This action returns all questionCategories`;
  }

  findOne(id: number) {
    return `This action returns a #${id} questionCategory`;
  }

  update(id: number, updateQuestionCategoryDto: UpdateQuestionCategoryDto) {
    return `This action updates a #${id} questionCategory`;
  }

  remove(id: number) {
    return `This action removes a #${id} questionCategory`;
  }
}

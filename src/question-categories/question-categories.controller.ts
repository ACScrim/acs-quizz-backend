import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuestionCategoriesService } from './question-categories.service';
import { CreateQuestionCategoryDto } from './dto/create-question-category.dto';
import { UpdateQuestionCategoryDto } from './dto/update-question-category.dto';

@Controller('question-categories')
export class QuestionCategoriesController {
  constructor(private readonly questionCategoriesService: QuestionCategoriesService) {}

  @Post()
  create(@Body() createQuestionCategoryDto: CreateQuestionCategoryDto) {
    return this.questionCategoriesService.create(createQuestionCategoryDto);
  }

  @Get()
  findAll() {
    return this.questionCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionCategoriesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuestionCategoryDto: UpdateQuestionCategoryDto) {
    return this.questionCategoriesService.update(+id, updateQuestionCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionCategoriesService.remove(+id);
  }
}

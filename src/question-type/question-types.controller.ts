import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuestionTypesService } from './question-types.service';
import { CreateQuestionTypeDto } from './dto/create-question-types.dto';
import { UpdateQuestionTypeDto } from './dto/update-question-types.dto';

@Controller('question-type')
export class QuestionTypesController {
  constructor(private readonly questionTypeService: QuestionTypesService) {}

  @Post()
  create(@Body() createQuestionTypeDto: CreateQuestionTypeDto) {
    return this.questionTypeService.create(createQuestionTypeDto);
  }

  @Get()
  findAll() {
    return this.questionTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionTypeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuestionTypeDto: UpdateQuestionTypeDto) {
    return this.questionTypeService.update(+id, updateQuestionTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionTypeService.remove(+id);
  }
}

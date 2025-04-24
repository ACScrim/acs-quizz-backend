import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuestionTypeService } from './question-type.service';
import { CreateQuestionTypeDto } from './dto/create-question-type.dto';
import { UpdateQuestionTypeDto } from './dto/update-question-type.dto';

@Controller('question-type')
export class QuestionTypeController {
  constructor(private readonly questionTypeService: QuestionTypeService) {}

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

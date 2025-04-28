import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Post('import')
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => cb(null, file.originalname),
      }),
    }),
  )
  async importQuestions(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('fieldsMapping') fieldsMappingStr: string,
    @Body('jsonPaths') jsonPathsStr?: string,
    @Body('globalsMapping') globalsMappingStr?: string // <-- nouveau paramètre
  ) {
    if (!files || !fieldsMappingStr)
      throw new BadRequestException('Fichier et fieldsMapping requis');
    const fieldsMapping = JSON.parse(fieldsMappingStr);
    const globalsMapping = globalsMappingStr ? JSON.parse(globalsMappingStr) : {};
  
    return this.questionsService.importQuestions(
      files, fieldsMapping, jsonPathsStr, globalsMapping
    );
  }

  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(+id, updateQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(+id);
  }
}

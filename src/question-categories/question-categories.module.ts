import { Module } from '@nestjs/common';
import { QuestionCategoriesService } from './question-categories.service';
import { QuestionCategoriesController } from './question-categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionCategory, QuestionCategorySchema } from './entities/question-category.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionCategory.name, schema: QuestionCategorySchema }
    ])
  ],
  controllers: [QuestionCategoriesController],
  providers: [QuestionCategoriesService],
  exports: [MongooseModule]
})
export class QuestionCategoriesModule {}

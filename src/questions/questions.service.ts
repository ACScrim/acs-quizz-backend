import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import * as fs from 'fs';
import { Question } from './entities/question.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QuestionCategory } from 'src/question-categories/entities/question-category.entity';
import { QuestionType } from 'src/question-type/entities/question-type.entity';


function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

@Injectable()
export class QuestionsService {

  constructor(
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    @InjectModel(QuestionCategory.name) private readonly questionCategoryModel: Model<QuestionCategory>,
    @InjectModel(QuestionType.name) private readonly questionTypeModel: Model<QuestionType>
  ) {}

  async importQuestions(
    files: Express.Multer.File[],
    fieldsMapping: Record<string, string>,
    jsonPathsStr?: string,
    globalsMapping: Record<string, string> = {}
  ) {
    let questions: Question[] = [];
    for (const file of files) {
      try {
        if (
          file.mimetype === 'application/json' ||
          file.originalname.endsWith('.json')
        ) {
          const raw = fs.readFileSync(file.path, 'utf8');
          const data = JSON.parse(raw);
  
          if (jsonPathsStr) {
            const jsonPaths: string[] = JSON.parse(jsonPathsStr);
            for (const path of jsonPaths) {
              const arr = getByPath(data, path);
              if (Array.isArray(arr)) {
                // Récupère dynamiquement les valeurs globales
                const globals: any = {};
                for (const [globalField, globalPath] of Object.entries(globalsMapping)) {
                  globals[globalField] = getByPath(data, globalPath as string);
                }
  
                arr.forEach((q) => {
                  const questionObj: any = {};
                  for (const [field, fieldPath] of Object.entries(fieldsMapping)) {
                    questionObj[field] = getByPath(q, fieldPath as string);
                  }
                  // Ajoute dynamiquement les valeurs globales
                  Object.assign(questionObj, globals);
                  questionObj.type = 'qcm'; // Défaut à 'text' si non spécifié
                  questions.push(questionObj);
                });
              }
            }
          } else {
            throw new BadRequestException(
              'jsonPaths requis pour ce type de fichier',
            );
          }
        } else {
          throw new BadRequestException('Format de fichier non supporté');
        }
      } finally {
        fs.unlinkSync(file.path);
      }
    }
    if (questions.length === 0) {
      throw new BadRequestException('Aucune question trouvée dans les fichiers');
    }

    for (const question of questions) {
      // Vérifie si la catégorie existe déjà
      const category = await this.questionCategoryModel.findOne({
        category: question.category,
      });
      if (!category) {
        // Si la catégorie n'existe pas, créez-la
        const newCategory = new this.questionCategoryModel({
          category: question.category,
        });
        await newCategory.save();
        question.category = newCategory; // Associe la nouvelle catégorie à la question
      } else {
        question.category = category; // Associe l'ID de la catégorie existante à la question
      }

      // Vérifie si le type de question existe déjà
      const type = await this.questionTypeModel.findOne({
        type: question.type,
      });
      if (!type) {
        // Si le type n'existe pas, créez-le
        const newType = new this.questionTypeModel({
          type: question.type,
        });
        await newType.save();
        question.type = newType; // Associe le nouveau type à la question
      } else {
        question.type = type; // Associe l'ID du type existant à la question
      }

      // Créez la question dans la base de données

      const newQuestion = new this.questionModel(question);
      await newQuestion.save(); // Enregistrez la question dans la base de données
    }



    return {
      imported: questions.length,
      questions
    };
  }
  

  create(createQuestionDto: CreateQuestionDto) {
    return 'This action adds a new question';
  }

  findAll() {
    return `This action returns all questions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} question`;
  }

  update(id: number, updateQuestionDto: UpdateQuestionDto) {
    return `This action updates a #${id} question`;
  }

  remove(id: number) {
    return `This action removes a #${id} question`;
  }
}

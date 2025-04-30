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
    @InjectModel(QuestionCategory.name)
    private readonly questionCategoryModel: Model<QuestionCategory>,
    @InjectModel(QuestionType.name)
    private readonly questionTypeModel: Model<QuestionType>,
  ) {}

  async importQuestions(
    files: Express.Multer.File[],
    fieldsMapping: Record<string, string>,
    jsonPathsStr?: string,
    globalsMapping: Record<string, string> = {},
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
                for (const [globalField, globalPath] of Object.entries(
                  globalsMapping,
                )) {
                  globals[globalField] = getByPath(data, globalPath as string);
                }

                arr.forEach((q) => {
                  const questionObj: any = {};
                  for (const [field, fieldPath] of Object.entries(
                    fieldsMapping,
                  )) {
                    questionObj[field] = getByPath(q, fieldPath as string);
                  }
                  // Ajoute dynamiquement les valeurs globales
                  Object.assign(questionObj, globals);
                  questionObj.type = 'multiple';
                  questions.push(questionObj);
                });
              }
            }
          } else if (Array.isArray(data)) {
            // Cas où le fichier est un tableau de questions à la racine
            // Récupère dynamiquement les valeurs globales
            const globals: any = {};
            for (const [globalField, globalPath] of Object.entries(
              globalsMapping,
            )) {
              globals[globalField] = getByPath(data, globalPath as string);
            }

            data.forEach((q) => {
              const questionObj: any = {};
              for (const [field, fieldPath] of Object.entries(fieldsMapping)) {
                questionObj[field] = getByPath(q, fieldPath as string);
              }
              Object.assign(questionObj, globals);
              questionObj.type = 'multiple';
              questions.push(questionObj);
            });
          } else {
            throw new BadRequestException(
              'Aucun chemin jsonPaths fourni et le fichier ne contient pas un tableau de questions à la racine.',
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
      throw new BadRequestException(
        'Aucune question trouvée dans les fichiers',
      );
    }

    for (const question of questions) {
      // Vérifie si la catégorie existe déjà
      question.category = await this.findAndCreateCategory(question.category.category);

      // Vérifie si le type de question existe déjà
      question.type = await this.findAndCreateType(question.type.type);

      // Créez la question dans la base de données

      const newQuestion = new this.questionModel(question);
      await newQuestion.save(); // Enregistrez la question dans la base de données
    }

    return {
      imported: questions.length,
      questions,
    };
  }

  async create(createQuestionDto: CreateQuestionDto) {
    const question = new this.questionModel(createQuestionDto);

    question.category = await this.findAndCreateCategory(createQuestionDto.category);

    // Vérifiez si le type de question existe déjà
    question.type = await this.findAndCreateType(createQuestionDto.type);

    // Créez la question dans la base de données
    return question.save();
  }

  findAll() {
    return this.questionModel.find().populate('category').populate('type');
  }

  findOne(id: string) {
    return this.questionModel
      .findById(id)
      .populate('category')
      .populate('type');
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    const question = await this.questionModel.findById(id);

    if (!question) {
      throw new BadRequestException('Question not found');
    }

    // Vérifiez si la catégorie existe déjà
    question.category = await this.findAndCreateCategory(updateQuestionDto.category);

    // Vérifiez si le type de question existe déjà
    question.type = await this.findAndCreateType(updateQuestionDto.type);

    // Mettez à jour la question avec les nouvelles valeurs
    question.question = updateQuestionDto.question || question.question;
    question.answer = updateQuestionDto.answer || question.answer;
    question.options = updateQuestionDto.options || question.options;
    question.difficulty = updateQuestionDto.difficulty || question.difficulty;
    // Enregistrez la question mise à jour dans la base de données
    return question.save();
  }

  remove(id: string) {
    return this.questionModel.findByIdAndDelete(id);
  }

  async findAndCreateCategory(categoryName?: string): Promise<QuestionCategory> {
    const category = await this.questionCategoryModel.findOne({
      category: categoryName
    });
    if (!category) {
      // Si la catégorie n'existe pas, créez-la
      const newCategory = new this.questionCategoryModel({
        category: categoryName
      }); // Associe la nouvelle catégorie à la question
      return newCategory.save(); // Enregistrez la catégorie dans la base de données
    } else {
      return category; // Associe l'ID de la catégorie existante à la question
    }
  }

  async findAndCreateType(typeName?: string): Promise<QuestionType> {
    const type = await this.questionTypeModel.findOne({
      type: typeName,
    });
    if (!type) {
      // Si le type n'existe pas, créez-le
      const newType = new this.questionTypeModel({
        type: typeName,
      });
      return newType.save(); // Enregistrez le type dans la base de données
    } else {
      return type; // Associe l'ID du type existant à la question
    }
  }
}

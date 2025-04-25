import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class QuestionCategory {
    @Prop()
    category: string;
}

export const QuestionCategorySchema = SchemaFactory.createForClass(QuestionCategory);
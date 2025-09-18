import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface ICategory extends Document {
  category_name: string;
  category_value: string;
  category_type: string;
  status: string;
}

@Schema({ collection: 'category' })
export class CategorySchema {
  @Prop({ required: true })
  category_name: string;

  @Prop({ required: true })
  category_value: string;

  @Prop({ required: true })
  category_type: string;

  @Prop({ required: true, default: 'Active' })
  status: string;
}

export const categorySchema = SchemaFactory.createForClass(CategorySchema);

// Indexes for category lookups in DynamicUiService
categorySchema.index({ category_name: 1, status: 1 });
categorySchema.index({ category_type: 1 });
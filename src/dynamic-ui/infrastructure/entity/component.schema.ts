import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes, Types } from "mongoose";

export type ComponentDocument = ComponentEntity & Document;

export class ComponentMedia {
  @Prop({ type: SchemaTypes.ObjectId })
  mediaId: Types.ObjectId;

  @Prop({ type: String })
  mediaUrl: string;

  @Prop({ type: String, enum: ["image", "video"] })
  type: string;
}

@Schema({ _id: false })
export class ComponentNavigation {
  @Prop({ type: String })
  type: string;

  @Prop({ type: SchemaTypes.ObjectId })
  pageId?: Types.ObjectId;

  @Prop({ type: String })
  url?: string;

  @Prop({ type: String, enum: ["_self", "_blank"], default: "_self" })
  target: string;

  @Prop({ type: SchemaTypes.Mixed })
  params?: Record<string, any>;

  @Prop({ type: SchemaTypes.Mixed })
  modalContent?: Record<string, any>;
}

@Schema({
  collection: "component",
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
})
export class ComponentEntity {
  @Prop({ required: true })
  componentKey: string;

  @Prop()
  displayType: string;

  @Prop({ type: String, enum: ["dynamic", "static"], default: "dynamic" })
  type: string;

  @Prop()
  title: string;

  @Prop()
  subtitle: string;

  @Prop()
  order: number;

  @Prop({ type: String, enum: ["Active", "Inactive"], default: "Active" })
  status: string;

  @Prop({ type: SchemaTypes.Mixed })
  actionData: any;

  @Prop({ type: SchemaTypes.Mixed })
  metaData: Record<string, any>;

  @Prop({ type: ComponentNavigation })
  navigation: ComponentNavigation;

  @Prop({ type: [ComponentMedia] })
  media: ComponentMedia[];

  @Prop({ type: SchemaTypes.ObjectId, ref: "user" })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: "user" })
  updatedBy: Types.ObjectId;
}

export const ComponentSchema = SchemaFactory.createForClass(ComponentEntity);

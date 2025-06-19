import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes, Types } from "mongoose";

export type ContentPageDocument = ContentPageEntity & Document;

@Schema({ _id: false })
export class ComponentRef {
  @Prop({ type: SchemaTypes.ObjectId })
  componentId: Types.ObjectId;
}

@Schema({
  collection: "contentPage",
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
})
export class ContentPageEntity {
  @Prop({ type: String, required: true })
  pageName: string;

  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: [ComponentRef], default: [] })
  components: ComponentRef[];

  @Prop({ type: String })
  bgColorCode: string;

  @Prop({ type: String, enum: ["Active", "Inactive"], default: "Active" })
  status: string;

  @Prop({ type: SchemaTypes.Mixed })
  metaData: Record<string, any>;
}

export const ContentPageSchema =
  SchemaFactory.createForClass(ContentPageEntity);

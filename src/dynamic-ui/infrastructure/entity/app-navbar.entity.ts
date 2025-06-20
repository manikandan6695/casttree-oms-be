import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes, Types } from "mongoose";
import { EStatus } from "../../interface/enums/status.enum";

export const AppNavBarDatabaseName = "appNavBar";

export class MediaModel {
  @Prop({ type: SchemaTypes.ObjectId, ref: "media" })
  mediaId: Types.ObjectId;

  @Prop({ type: String })
  mediaUrl: string;
}

@Schema({ _id: false })
export class Tab {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: MediaModel })
  icon: MediaModel;

  @Prop({ type: MediaModel })
  bgImage: MediaModel;

  @Prop({ type: String })
  bgColorCode: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: "contentPage", required: true })
  pageId: Types.ObjectId;
}

@Schema({
  collection: AppNavBarDatabaseName,
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
})
export class AppNavBarEntity extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  key: string;

  @Prop({ type: String, required: true })
  position: string;

  @Prop({ type: [Tab], required: true })
  tabs: Tab[];

  @Prop({ type: String, required: true })
  orientation: string;

  @Prop({
    type: String,
    enum: Object.values(EStatus),
    default: EStatus.ACTIVE,
  })
  status: EStatus;
}

export const AppNavBarSchema = SchemaFactory.createForClass(AppNavBarEntity);

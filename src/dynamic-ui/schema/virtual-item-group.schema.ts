import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VirtualItemGroupDocument = VirtualItemGroup & Document;

@Schema({ 
  timestamps: true,
  collection: 'virtualItemGroup'
})
export class VirtualItemGroup {
  @Prop({ required: true })
  virtualItemGroupName: string;

  @Prop({
    type: [{
      sourceId: { type: Types.ObjectId, required: true },
      sourceType: { type: String, required: true, enum: ['award', 'process', 'series', 'episode'] }
    }],
    default: []
  })
  source: Array<{
    sourceId: Types.ObjectId;
    sourceType: string;
  }>;

  @Prop({
    type: [Types.ObjectId],
    ref: 'VirtualItem',
    default: []
  })
  virtualItemIds: Types.ObjectId[];
}

export const VirtualItemGroupSchema = SchemaFactory.createForClass(VirtualItemGroup);


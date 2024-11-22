
import mongoose from "mongoose";
import { faqModel, faqSchema } from "./faq.schema";
import { highlightsModel, highlightsSchema } from "./highlights.schema";
import { targetUsersModel, targetUsersSchema } from "./targetUsers.schema";
import { testimonialModel, testimonialSchema } from "./testimonial.schema";
import { videoDescriptionModel, videoDescriptionSchema } from "./videoDescription.schema";
export interface IMedia {
    type?: string;
    media_id?: any;
    visibility?: string;
  }
  export const MediaSchema = new mongoose.Schema({
    type: {
      type: String,
      description: "Types of the media",
    },
    visibility: {
      type: String,
      description: "Privacy settings of email",
      default: "Public",
    }, //public, private, mutual
    media_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "media",
    },
  });
export interface itemAdditionalDetailModel {

    meetingLink: string;
    registrationExpiry: Date;
    defaultImage: IMedia[];
    workShopStartDate:  Date;
    mode: string;
    workShopEndDate:  Date;
    startTime:String;
    endTime:String;
    faq: faqModel[];
    highlights: highlightsModel[];
    targetUsers: targetUsersModel[];
    testimonials: testimonialModel[];
    videDescription: videoDescriptionModel[]
  
  }
  export const itemAdditionalDetailSchema = new mongoose.Schema<any>({

    meetingLink: { type: String },
    registrationExpiry: { type: Date },
    defaultImage: [MediaSchema],
    workShopStartDate: { type: Date },
    mode: {
      type: String
    },
    workShopEndDate: { type: Date },
    startTime: {
      type: String
    },
    endTime: {
      type: String
    },
    faq:[faqSchema],
    highlights:[highlightsSchema],
    targetUsers: [targetUsersSchema],
    testimonials: [testimonialSchema],
    videDescription:[videoDescriptionSchema]
  });
  
  
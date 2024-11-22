
import mongoose from "mongoose";


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
  export interface faqModel {
    question: string;
    answer: string;


}
export const faqSchema = new mongoose.Schema<any>({
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
});
export interface highlightsModel {
    icon: string;
    title: string;
    body: string;

}
export const highlightsSchema = new mongoose.Schema<any>({
    icon: {
        type: String,
    },
    title: {
        type: String,
    },
    body: {
        type: String,
    }

});
export interface targetUsersModel {
    icon: string;
    title: string;
    body: string;

}
export const targetUsersSchema = new mongoose.Schema<any>({
    icon: {
        type: String,
    },
    title: {
        type: String,
    },
    body: {
        type: String,
    }

});

export interface testimonialModel {
    image: string;
    name: string;
    body: string;

}
export const testimonialSchema = new mongoose.Schema<any>({
    image: {
        type: String,
    },
    name: {
        type: String,
    },
    body: {
        type: String,
    }

});

export interface videoDescriptionModel {
    title: string;
    body: string;
    mediaUrl: string;


}
export const videoDescriptionSchema = new mongoose.Schema<any>({
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    mediaUrl: {
        type: String,
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
  
  
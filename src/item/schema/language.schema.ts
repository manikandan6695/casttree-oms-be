import mongoose from "mongoose";
export interface ILanguageModel {
    languageName: string;
    languageId: string;
    languageCode:string;
   
  }
  export const languageSchema = new mongoose.Schema<any>({
    languageName: {
      type: String,
    },
    languageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"language"
     
    },
    languageCode:{
      type: String,
    }
    
  });
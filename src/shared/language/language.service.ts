import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ILanguage } from "../schema/language.schema";

@Injectable()
export class LanguageService {
  constructor(
    @InjectModel("language") private language_model: Model<ILanguage>
  ) {}
  async getLanguage(search: string, skip: number, limit: number) {
    try {
      let filter = {};
      if (search) {
        filter["language_name"] = new RegExp(search, "i");
      }
      let data = await this.language_model
        .find(filter)
        .populate({
          path: "media.mediaId",
          model: "media",
          select: "location",
        })
        .sort({ language_name: 1 })
        .skip(skip)
        .limit(limit);
      let count = await this.language_model.countDocuments(filter);
      return { data, count };
    } catch (err) {
      throw err;
    }
  }
}

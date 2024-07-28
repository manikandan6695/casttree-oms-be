import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IDateFormatModel } from "../schema/date-format.schema";

@Injectable()
export class DateFormatService {
  constructor(
    @InjectModel("date-format")
    private date_format_model: Model<IDateFormatModel>
  ) {}

  getDateFormat() {
    return this.date_format_model.find();
  }

  getDateFormatById(id: string) {
    return this.date_format_model.findById(id);
  }
}

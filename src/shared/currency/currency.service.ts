import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ICurrencyModel } from "../schema/currency.schema";

@Injectable()
export class CurrencyService {
  constructor(
    @InjectModel("currency") private currency_model: Model<ICurrencyModel>
  ) {}
  async getCurrency(search: string, skip: number, limit: number) {
    try {
      let cond = [];
      if (search) {
        let search_regex = new RegExp(search, "i");
        cond.push({ currency_name: search_regex });
        cond.push({ currency_code: search_regex });
      }
      let filter = {};
      if (cond.length) {
        filter["$or"] = cond;
      }
      let data = await this.currency_model
        .find(filter)
        .skip(skip)
        .limit(limit);
      let count = await this.currency_model.countDocuments(filter);
      return { data, count };
    } catch (err) {
      throw err;
    }
  }

  getSingleCurrency(currency_id: string) {
    try {
      return this.currency_model.findById(currency_id);
    } catch (err) {
      throw err;
    }
  }

  async getDefaultCurrency() {
    try {
      let data = await this.currency_model.findOne({
        is_default: true,
      });
      return data;
    } catch (err) {
      throw err;
    }
  }
}

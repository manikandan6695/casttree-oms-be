import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ICountryModel } from "../schema/country.schema";

@Injectable()
export class CountryService {
  constructor(
    @InjectModel("country") private country_model: Model<ICountryModel>
  ) {}
  async getCountry(search: string, skip: number, limit: number) {
    try {
      let filter = {};
      if (search) {
        filter["country_name"] = new RegExp(search, "i");
      }
      let data = await this.country_model
        .find(filter)
        .skip(skip)
        .limit(limit);
      let count = await this.country_model.countDocuments(filter);
      return { data, count };
    } catch (err) {
      throw err;
    }
  }

  async getCountryDetail(country_code) {
    try {
      let data = await this.country_model.findOne({
        country_code: country_code,
      });
      console.log("data is", data);
      return data;
    } catch (err) {
      throw err;
    }
  }
  async getDefaultCountry() {
    try {
      let data = await this.country_model.findOne({
        is_default: true,
      });
      return data;
    } catch (err) {
      throw err;
    }
  }
}

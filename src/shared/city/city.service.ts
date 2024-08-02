import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ICityModel } from "../schema/city.schema";

@Injectable()
export class CityService {
  constructor(@InjectModel("city") private city_model: Model<ICityModel>) {}
  async getCity(
    country: string,
    state: string,
    search: string,
    skip: number,
    limit: number
  ) {
    try {
      let filter = {};
      if (search) {
        filter["city_name"] = new RegExp(search, "i");
      }
      // if (country) {
      filter["country"] = "6091509ab0a4f304022c2574";
      // }
      if (state) {
        filter["state"] = state;
      }
      console.log("filter is", filter);
      let data = await this.city_model
        .find(filter)
        .sort("city_name")
        .skip(skip)
        .limit(limit);
      let count = await this.city_model.countDocuments(filter);
      return { data, count };
    } catch (err) {
      throw err;
    }
  }
  async validateCountryStateCityCombination(
    country_id: string,
    state_id: string,
    city_id: string
  ) {
    try {
      let filter = { country_id, state_id, city_id };
      let data = await this.city_model.findOne(filter);
      return data ? true : false;
    } catch (err) {
      throw err;
    }
  }
}

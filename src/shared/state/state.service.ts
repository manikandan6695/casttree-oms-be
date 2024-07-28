import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IStateModel } from "../schema/state.schema";
import { GetStateDTO } from "./dto/get-state-by-country.dto";

@Injectable()
export class StateService {
  constructor(@InjectModel("state") private state_model: Model<IStateModel>) {}
  async getCountryBasedStates(
    country: string,
    search: string,
    skip: number,
    limit: number
  ) {
    try {
      let filter = {};
      if (search) {
        filter["state_name"] = new RegExp(search, "i");
      }
      if (country) {
        filter["country"] = country;
      }
      let data = await this.state_model.find(filter).skip(skip).limit(limit);
      let count = await this.state_model.countDocuments(filter);
      return { data, count };
    } catch (err) {
      throw err;
    }
  }
  async validateCountryStateCombination(country_id: string, state_id: string) {
    try {
      let filter = { country_id, state_id };
      let data = await this.state_model.findOne(filter);
      return data ? true : false;
    } catch (err) {
      throw err;
    }
  }
  async getStateList(body?: GetStateDTO, organization_country?: string) {
    try {
      let filter = { country: "6091509ab0a4f304022c2574" };
      // console.log("filter is", filter);

      if (body.search) {
        filter["state_name"] = new RegExp(body.search, "i");
      }
      let data = await this.state_model
        .find(filter)
        .sort("state_name")
        .skip(body.skip)
        .limit(body.limit);
      let count = await this.state_model.countDocuments(filter);
      return { data, count };
    } catch (err) {
      throw err;
    }
  }
}

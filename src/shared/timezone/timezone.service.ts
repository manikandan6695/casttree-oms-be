import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ITimeZoneModel } from "../schema/time-zone.schema";

@Injectable()
export class TimezoneService {
  constructor(
    @InjectModel("timeZone") private timezone_model: Model<ITimeZoneModel>
  ) {}

  getTimeZones() {
    return this.timezone_model.find();
  }

  getSingeTimeZone(zone_id: string) {
    return this.timezone_model.findById(zone_id);
  }

  async getDefaultTimeZone() {
    try {
      let data = await this.timezone_model.findOne({
        is_default: true,
      });
      return data;
    } catch (err) {
      throw err;
    }
  }
}

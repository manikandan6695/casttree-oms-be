import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { serviceitems } from "./schema/serviceItem.schema";
import { FilterItemRequestDTO } from "./dto/filter-item.dto";
import { HelperService } from "src/helper/helper.service";

@Injectable()
export class ServiceItemService {
  constructor(
    @InjectModel("serviceitems") private serviceItemModel: Model<serviceitems>,
    private helperService: HelperService
  ) { }
  async getServiceItems(
    query: FilterItemRequestDTO,
    accessToken: string,
    skip: number,
    limit: number
  ) {
    try {
      const filter = {};
      if (query.languageCode) {
        if (typeof query.languageCode === "string") {
          filter["language.languageCode"] = query.languageCode;
        } else {
          filter["language.languageCode"] = { $in: query.languageCode };
        }
      }
      if (query.skill) {
        if (typeof query.skill === "string") {
          filter["skill"] = query.skill;
        } else {
          filter["skill"] = { $in: query.skill };
        }
      }
      let serviceItemData = await this.serviceItemModel
        .find(filter)
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const countData = await this.serviceItemModel.countDocuments(filter);
      const userIds = serviceItemData.map((e) => e.userId);
      const profileInfo = await this.helperService.getProfileById(
        userIds,
        accessToken,
        "Expert"
      );
      const userProfileInfo = profileInfo.reduce((a, c) => {
        a[c.userId] = c;
        return a;
      }, {});


      for (let i = 0; i < serviceItemData.length; i++) {
        serviceItemData[i]["profileData"] = userProfileInfo[serviceItemData[i]["userId"]]
      }

      return { data: serviceItemData, count: countData };
    } catch (err) {
      throw err;
    }
  }

  async getServiceItemDetails(_id: string, accessToken: string,) {
    try {
      const data = await this.serviceItemModel
        .findOne({ _id: _id })
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean();
      const profileInfo = await this.helperService.getProfileById(
        [data.userId],
        accessToken,
        "Expert"
      );
      data["profileData"] = profileInfo[0];
      return data;
    } catch (err) {
      throw err;
    }
  }
}

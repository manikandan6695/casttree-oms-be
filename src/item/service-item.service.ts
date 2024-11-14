import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { serviceitems } from "./schema/serviceItem.schema";
import { FilterItemRequestDTO } from "./dto/filter-item.dto";
import { HelperService } from "src/helper/helper.service";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { Eitem } from "./enum/rating_sourcetype_enum";
import { EprofileType } from "./enum/profileType.enum";
import { EserviceItemType } from "./enum/serviceItem.type.enum";
import { Estatus } from "./enum/status.enum";

@Injectable()
export class ServiceItemService {
  constructor(
    @InjectModel("serviceitems") private serviceItemModel: Model<serviceitems>,
    private readonly serviceRequestService: ServiceRequestService,
    private helperService: HelperService



  ) { }
  async getServiceItems(
    query: FilterItemRequestDTO,
    //accessToken: string,
    skip: number,
    limit: number
  ) {
    try {
      const filter = {};
      if (query.languageId) {
        if (typeof query.languageId === "string") {
          filter["language.languageId"] = query.languageId;
        } else {
          filter["language.languageId"] = { $in: query.languageId };
        }
      }
      if (query.skillId) {
        if (typeof query.skillId === "string") {
          filter["skill.skillId"] = query.skillId;
        } else {
          filter["skill.skillId"] = { $in: query.skillId };
        }
      }
      if (query.type) {
        filter['type'] = query.type;
      }
      filter['status'] = Estatus.Active;

      /*if (query.type === EserviceItemType.workShop) {
        if (query.mode) {
          filter['itemId.additionalDetail.mode'] = query.mode;
        }
        if (query.displayName) {
          filter['profileData.displayName'] = query.displayName;
        }
      }*/


      let serviceItemData: any = await this.serviceItemModel
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
      const sourceIds = serviceItemData.map((e) => e.itemId._id.toString());
      const profileInfo = await this.helperService.getProfileByIdTl(
        userIds,
     
        EprofileType.Expert
      );
      const ratingInfo = await this.helperService.getRatings(
        sourceIds,
        Eitem.item,
       
      );
      const userProfileInfo = profileInfo.reduce((a, c) => {
        a[c.userId] = c;
        return a;
      }, {});
      const userRatingInfo = ratingInfo.reduce((a, c) => {
        a[c.sourceId] = c;
        return a;
      }, {});

      for (let i = 0; i < serviceItemData.length; i++) {
        serviceItemData[i]["profileData"] = userProfileInfo[serviceItemData[i]["userId"]];
        serviceItemData[i]["ratingData"] = userRatingInfo[(serviceItemData[i].itemId._id).toString()] ?? null;
      }
      return { data: serviceItemData, count: countData };
    } catch (err) {
      throw err;
    }
  }

  async getServiceItemDetails(id: string) {
  
    try {
      var data: any = await this.serviceItemModel
        .findOne({ _id: id })
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean();

      const profileInfo = await this.helperService.getProfileByIdTl(
        [data.userId],
    
        EprofileType.Expert
      );

      const ratingInfo = await this.helperService.getRatingsSummary(
        data.itemId._id,
        Eitem.item,
     

      );
      const totalFeedbacks = await this.serviceRequestService.getCompletedServiceRequest(data.userId, data.itemId.orgId._id);
      data["profileData"] = profileInfo[0];
      data["itemSold"] = parseInt(profileInfo[0].phoneNumber[9]) + 10 + totalFeedbacks.count ?? 0;
      data["ratingsData"] = ratingInfo.data;
      return data;
    } catch (err) {
      throw err;
    }
  }


  async serviceDueDate(itemId: string, userId: string) {
    try {
      let data: any = await this.serviceItemModel.findOne({ itemId: itemId, userId: userId }).lean();
      let days = data.respondTime.split(" ")[0];
      let serviceDueDate = new Date(new Date().setDate(new Date().getDate() + parseInt(days))).toISOString();
      data["serviceDueDate"] = serviceDueDate;
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getLanguages(itemId: string) {
    try {
      let data = await this.serviceItemModel.findOne({ itemId: itemId }, { language: 1 });
      return data;
    } catch (err) {
      throw err;
    }
  }



  async getWorkshopServiceItems(
    query: FilterItemRequestDTO,
    skip: number,
    limit: number
  ) {
    try {
      const filter = {};
      if (query.languageId) {
        if (typeof query.languageId === "string") {
          filter["language.languageId"] = query.languageId;
        } else {
          filter["language.languageId"] = { $in: query.languageId };
        }
      }
      if (query.skillId) {
        if (typeof query.skillId === "string") {
          filter["skill.skillId"] = query.skillId;
        } else {
          filter["skill.skillId"] = { $in: query.skillId };
        }
      }
      filter['type'] = EserviceItemType.workShop;
      filter['status'] = Estatus.Active;
      let serviceItemData: any = await this.serviceItemModel
        .find(filter)
        .populate( "itemId" ," itemName additionalDetail price comparePrice orgId currency")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const countData = await this.serviceItemModel.countDocuments(filter);
      const userIds = serviceItemData.map((e) => e.userId);
      const profileInfo = await this.helperService.getworkShopProfileById(
        userIds,
        EprofileType.Expert
      );
      const userProfileInfo = profileInfo.reduce((a, c) => {
        a[c.userId] = c;
        return a;
      }, {});
      for (let i = 0; i < serviceItemData.length; i++) {
        serviceItemData[i]["profileData"] = userProfileInfo[serviceItemData[i]["userId"]];
      }
      return { data: serviceItemData, count: countData };
    } catch (err) {
      throw err;
    }
  }



  async getworkShopServiceItemDetails(id: string) {
    try {
      var data: any = await this.serviceItemModel
        .findOne({ _id: id })
        .populate( "itemId" ," itemName additionalDetail price comparePrice orgId currency")
        .lean();

      const profileInfo = await this.helperService.getworkShopProfileById(
        [data.userId],

        EprofileType.Expert
      );
      data["profileData"] = profileInfo[0];
      return data;
    } catch (err) {
      throw err;
    }
  }

}

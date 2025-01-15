import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { HelperService } from "src/helper/helper.service";
import { ProcessService } from "src/process/process.service";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { FilterItemRequestDTO } from "./dto/filter-item.dto";
import { EcomponentType, Eheader, Etag } from "./enum/courses.enum";
import { EprofileType } from "./enum/profileType.enum";
import { Eitem } from "./enum/rating_sourcetype_enum";
import { EserviceItemType } from "./enum/serviceItem.type.enum";
import { Estatus } from "./enum/status.enum";
import { ItemService } from "./item.service";
import { IPriceListItemsModel } from "./schema/price-list-items.schema";
import { serviceitems } from "./schema/serviceItem.schema";

@Injectable()
export class ServiceItemService {
  constructor(
    @InjectModel("serviceitems") private serviceItemModel: Model<serviceitems>,
    @InjectModel("priceListItems") private priceListItemModel: Model<IPriceListItemsModel>,
    private helperService: HelperService,
    @Inject(forwardRef(() => ProcessService))
    private processService: ProcessService,
    @Inject(forwardRef(() => ServiceRequestService))
    private serviceRequestService: ServiceRequestService,
    private itemService: ItemService

  ) { }
  async getServiceItems(
    query: FilterItemRequestDTO,
    //accessToken: string,
    skip: number,
    limit: number,
    country_code: string = ""
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
        filter["type"] = query.type;
      }
      filter["status"] = Estatus.Active;
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
      if (country_code) {
        const uniqueArray = [
          ...new Set(sourceIds.map((id) => new mongoose.Types.ObjectId(id))),
        ];
        let priceListData = await this.getPriceListItems(
          uniqueArray,
          country_code
        );
        serviceItemData.forEach((e) => {
          let currData = priceListData[e.itemId._id.toString()];
          if (currData) {
            e.itemId["price"] = currData["price"];
            e.itemId["comparePrice"] = currData["comparePrice"];
            e.itemId["currency"] = currData["currency"];
          }
        });
      }
      const profileInfo = await this.helperService.getProfileByIdTl(
        userIds,

        EprofileType.Expert
      );
      const ratingInfo = await this.helperService.getRatings(
        sourceIds,
        Eitem.item
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
        serviceItemData[i]["profileData"] =
          userProfileInfo[serviceItemData[i]["userId"]];
        serviceItemData[i]["ratingData"] =
          userRatingInfo[serviceItemData[i].itemId._id.toString()] ?? null;
      }
      return { data: serviceItemData, count: countData };
    } catch (err) {
      throw err;
    }
  }

  async getServiceItemDetails(id: string, country_code: string = "") {
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
        Eitem.item
      );
      const totalFeedbacks =
        await this.serviceRequestService.getCompletedServiceRequest(
          data.userId,
          data.itemId.orgId._id
        );
      data["profileData"] = profileInfo[0];
      data["itemSold"] =
        parseInt(profileInfo[0].phoneNumber[9]) + 10 + totalFeedbacks.count;
      data["ratingsData"] = ratingInfo.data;
      if (country_code) {
        let priceListData = await this.getPriceListItems(
          [new mongoose.Types.ObjectId(data.itemId._id.toString())],
          country_code
        );
        let currData = priceListData[data.itemId._id.toString()];
        if (currData) {
          data.itemId["price"] = currData["price"];
          data.itemId["comparePrice"] = currData["comparePrice"];
          data.itemId["currency"] = currData["currency"];
        }
      }
      let newQuery = {
        skillId: data.skill.skillId,
        type: EserviceItemType.feedback,
      };
      let moreExpertsData = await this.getServiceItems(
        newQuery,
        0,
        500,
        country_code
      );

      const updatedMoreExpertsData = [];
      for (let i = 0; i < moreExpertsData.data.length; i++) {
        if (moreExpertsData.data[i]._id.toString() != data._id.toString()) {
          updatedMoreExpertsData.push({
            _id: moreExpertsData.data[i]._id,
            languages: moreExpertsData.data[i].language,
            name: moreExpertsData.data[i].profileData.userName,
            media: moreExpertsData.data[i].profileData.media,
            is_verified: moreExpertsData.data[i].profileData.is_verified,
            about: moreExpertsData.data[i].profileData.about,
            tags: moreExpertsData.data[i].profileData.tags,
            ratings: moreExpertsData.data[i].ratingData,
          });
        }
      }
      data["similarExperts"] = updatedMoreExpertsData;
      return data;
    } catch (err) {
      throw err;
    }
  }

  async serviceDueDate(itemId: string, userId: string) {
    try {
      let data: any = await this.serviceItemModel
        .findOne({ itemId: itemId, userId: userId })
        .lean();
      let days = data.respondTime.split(" ")[0];
      let serviceDueDate = new Date(
        new Date().setDate(new Date().getDate() + parseInt(days))
      ).toISOString();
      data["serviceDueDate"] = serviceDueDate;
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getLanguages(itemId: string) {
    try {
      let data = await this.serviceItemModel.findOne(
        { itemId: itemId },
        { language: 1 }
      );
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
      filter["type"] = EserviceItemType.workShop;
      filter["status"] = Estatus.Active;
      let serviceItemData: any = await this.serviceItemModel
        .find(filter)
        .populate(
          "itemId",
          " itemName itemDescription additionalDetail price comparePrice orgId currency"
        )
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
        serviceItemData[i]["profileData"] =
          userProfileInfo[serviceItemData[i]["userId"]];
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
        .populate(
          "itemId",
          " itemName itemDescription additionalDetail price comparePrice orgId currency"
        )
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

  async getPriceListItems(itemIds: any[], country_code: string) {
    try {
      let data = await this.priceListItemModel
        .find(
          { item_id: { $in: itemIds }, country_code: country_code },
          {
            price: 1,
            comparePrice: 1,
            currency: 1,
            item_id: 1,
          }
        )
        .populate("currency", "_id currency_name currency_code")
        .lean();
      return data.reduce((acc, cur) => {
        acc[`${cur.item_id.toString()}`] = cur;
        return acc;
      }, {});
    } catch (err) {
      throw err;
    }
  }

  async getCourseHomeScreenData(userId) {
    try {
      let featuredData: any = await this.serviceItemModel.find({ type: "courses", "tag.name": Etag.featured });
      let featureCarouselData = {
        "ListData": []
      };
      let seriesForYouData: any = await this.serviceItemModel.find({ type: "courses", "tag.name": Etag.SeriesForYou });
      let updatedSeriesForYouData = {
        "ListData": []
      };
      let processIds = [];
      for (let i = 0; i < seriesForYouData.length; i++) {
        processIds.push(seriesForYouData[i]?.additionalDetails?.processId);
      }
      for (let i = 0; i < featuredData.length; i++) {
        processIds.push(featuredData[i].additionalDetails.processId);
      }
      let firstTasks = await this.processService.getFirstTask(processIds);
      //return firstTasks;
      const firstTaskObject = firstTasks.reduce((a, c) => {
        a[c.processId] = c;
        return a;
      }, {});
      for (let i = 0; i < featuredData.length; i++) {
        let processId = seriesForYouData[i].additionalDetails.processId.toString();
        featureCarouselData["ListData"].push({
          "processId": featuredData[i].additionalDetails.processId,
          "thumbnail": featuredData[i].additionalDetails.thumbnail,
          "ctaName": featuredData[i].additionalDetails.ctaName,
          "taskDetail": firstTaskObject[featuredData[i].additionalDetails.processId]
        })
      }
      for (let i = 0; i < seriesForYouData.length; i++) {
        let processId = seriesForYouData[i].additionalDetails.processId.toString();
        updatedSeriesForYouData["ListData"].push({
          "processId": seriesForYouData[i].additionalDetails.processId,
          "thumbnail": seriesForYouData[i].additionalDetails.thumbnail,
          "taskDetail": firstTaskObject[seriesForYouData[i].additionalDetails.processId]
        })
      }
      let sections = [];
      let pendingProcessInstanceData = await this.processService.pendingProcess(userId);
      let continueWhereYouLeftData = {
        "ListData": []
      };
      if (pendingProcessInstanceData.length > 0) {
        let continueProcessIds = [];

        for (let i = 0; i < pendingProcessInstanceData.length; i++) {
          continueProcessIds.push(pendingProcessInstanceData[i].processId)
        }
        let mentorUserIds = await this.getMentorUserIds(continueProcessIds);

        for (let i = 0; i < pendingProcessInstanceData.length; i++) {

          continueWhereYouLeftData["ListData"].push({
            "thumbnail": pendingProcessInstanceData[i].currentTask.taskMetaData.media[0]?.mediaUrl,
            "title": pendingProcessInstanceData[i].currentTask.taskTitle,
            "ctaName": "Continue",
            "progressPercentage": pendingProcessInstanceData[i].completed,
            "navigationURL": "process/" + pendingProcessInstanceData[i].processId + "/task/" + pendingProcessInstanceData[i].currentTask._id,
            "taskDetail": pendingProcessInstanceData[i].currentTask,
            "mentorImage": mentorUserIds[i].media,
            "mentorName": mentorUserIds[i].displayName,
            "seriesTitle": pendingProcessInstanceData[i].processId.processMetaData.processTitle
          });
        }
      }
      sections.push({
        "data": {
          "headerName": Eheader.continue,
          "listData": continueWhereYouLeftData["ListData"]
        },
        "horizontalScroll": true,
        "componentType": EcomponentType.ActiveProcessList

      }),
        sections.push({
          "data": {
            "listData": featureCarouselData["ListData"]
          },
          "horizontalScroll": true,
          "componentType": EcomponentType.feature
        }),
        sections.push({
          "data": {
            "headerName": Eheader.mySeries,
            "listData": updatedSeriesForYouData["ListData"]
          },
          "horizontalScroll": false,
          "componentType": EcomponentType.ColThumbnailList
        });

      let data = {};
      data["sections"] = sections;

      let finalResponse = {
        "status": 200,
        "message": "success",
        "data": data
      }
      return finalResponse;;
    } catch (err) {
      throw err;
    }
  }


  async getMentorUserIds(processId) {
    try {


      let mentorUserIds = await this.serviceItemModel.find({ type: "courses", "additionalDetails.processId": { $in: processId } }, { userId: 1 });
      let userIds = [];
      for (let i = 0; i < mentorUserIds.length; i++) {
        userIds.push(mentorUserIds[i].userId.toString());
      }

      const profileInfo = await this.helperService.getProfileByIdTl(
        userIds
      );
      const profileInfoObj = profileInfo.reduce((a, c) => {
        a[c.userId] = c;
        return a;
      }, {});

      let mentorProfiles = [];
      for (let i = 0; i < processId.length; i++) {
        mentorProfiles.push(
          {
            "processId": processId[i],
            "userId": userIds[i],
            "displayName": profileInfoObj[userIds[i]]?.displayName,
            "media": profileInfoObj[userIds[i]]?.media
          }
        );
      }

      return mentorProfiles;
    } catch (err) {
      throw err;
    }
  }

  async getPlanDetails(processId) {
    try {
      let processPricingData: any = await this.serviceItemModel.findOne({ "additionalDetails.processId": processId }).populate("itemId").lean();
      let ids = ["677c06ce97b11f5b314ea8e5", "677c06cb97b11f5b314ea8e4"];
      let plandata: any = await this.itemService.getItemsDetails(ids);
      let finalResponse = {};
      let featuresArray = [];
      featuresArray.push({
        "feature": "planType",
        "values": ["THIS COURSE", "CASTTREE PREMIUM", "CASTTREE PREMIUM PRO"]
      });
      featuresArray.push({ "feature": "Access to this course", "values": ["check", "check", "check"] });
      for (let i = 0; i < plandata[0].additionalDetail.planDetails.length; i++) {
        let feature = plandata[0].additionalDetail.planDetails[i].feature;
        let values = ["close", plandata[1].additionalDetail.planDetails[i].value, plandata[0].additionalDetail.planDetails[i].value];
        featuresArray.push({ "feature": feature, "values": values });
      }
      let planIds = [null, plandata[1].additionalDetail.planId, plandata[0].additionalDetail.planId];
      let headings = ["THIS COURSE", plandata[1].itemName, plandata[0].itemName];
      let actualPrice = [processPricingData.itemId.price, plandata[1].price, plandata[0].price];
      let comparePrice = [processPricingData.itemId.comparePrice, plandata[1].comparePrice, plandata[0].comparePrice];
      let badgeColour = ["#FFC107D4", "#FF8762", "#06C270"];
      let keys = ["casttree", plandata[1].additionalDetail.key, plandata[0].additionalDetail.key];
      let planDetailsArray = [];
      for (let i = 0; i < headings.length; i++) {
        planDetailsArray.push({
          "key": keys[i],
          "heading": headings[i],
          "planIds": planIds[i],
          "actualPrice": actualPrice[i],
          "comparePrice": comparePrice[i],
          "badgeColour": badgeColour[i],
          "expiry": "this year"
        })
      }
      finalResponse["planData"] = planDetailsArray;
      finalResponse["featuresData"] = featuresArray;

      return finalResponse;
    } catch (err) {
      throw err;
    }
  }
}

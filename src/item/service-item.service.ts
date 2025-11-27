import { log } from "console";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import mongoose, { Model } from "mongoose";
import { EMixedPanelEvents } from "src/helper/enums/mixedPanel.enums";
import { HelperService } from "src/helper/helper.service";
import { MandatesService } from "src/mandates/mandates.service";
import { EsubscriptionStatus } from "src/process/enums/process.enum";
import { ProcessService } from "src/process/process.service";
import {
  EServiceRequestStatus,
  EStatus,
} from "src/service-request/enum/service-request.enum";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { ISystemConfigurationModel } from "src/shared/schema/system-configuration.schema";
import { SubscriptionService } from "src/subscription/subscription.service";
import { FilterItemRequestDTO } from "./dto/filter-item.dto";
import { EcomponentType, Eheader } from "./enum/courses.enum";
import { EprofileType } from "./enum/profileType.enum";
import { Eitem } from "./enum/rating_sourcetype_enum";
import {
  EButtonText,
  ENavigation,
  EPageTypeKey,
  EPayWallType,
  ERecommendationListType,
  EServiceItemTag,
  EserviceItemType,
  EType,
} from "./enum/serviceItem.type.enum";
import { Estatus } from "./enum/status.enum";
import { ItemService } from "./item.service";
import { IPriceListItemsModel } from "./schema/price-list-items.schema";
import { serviceitems } from "./schema/serviceItem.schema";
import {
  EItemName,
  EItemTag,
  ESystemConfigurationKeyName,
} from "./enum/item-type.enum";
import { UserToken } from "src/auth/dto/usertoken.dto";

@Injectable()
export class ServiceItemService {
  constructor(
    @InjectModel("serviceitems") private serviceItemModel: Model<serviceitems>,
    @InjectModel("priceListItems")
    private priceListItemModel: Model<IPriceListItemsModel>,
    @InjectModel("systemConfiguration")
    private systemConfigurationModel: Model<ISystemConfigurationModel>,
    @Inject(forwardRef(() => HelperService))
    private helperService: HelperService,
    @Inject(forwardRef(() => ProcessService))
    private processService: ProcessService,
    @Inject(forwardRef(() => ServiceRequestService))
    private serviceRequestService: ServiceRequestService,
    private itemService: ItemService,
    private subscriptionService: SubscriptionService,
    private mandateService: MandatesService
  ) {}
  async getServiceItemDetailbyItemId(itemId) {
    try {
      let data = await this.serviceItemModel
        .findOne({ itemId: itemId })
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean();
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getServiceItemDetailbyProcessId(processId: string | string[], userId?) {
    try {
      let data;
      if (Array.isArray(processId)) {
        data = await this.serviceItemModel
          .find(
            { "additionalDetails.processId": { $in: processId } },
            { userId: 1, additionalDetails: 1, itemId: 1 }
          )
          .populate({
            path: "itemId",
          })
          .lean();
        const userIds = data.map((e) => e.userId);
        const profileInfo = await this.helperService.getProfileByIdTl(
          userIds,
          EprofileType.Expert
        );
        const userProfileInfo = profileInfo.reduce((a, c) => {
          a[c.userId] = c;
          return a;
        }, {});
        let firstTasks = await this.processService.getFirstTask(
          processId,
          userId
        );

        const firstTaskObject = firstTasks.reduce((a, c) => {
          a[c.processId] = c;
          return a;
        }, {});

        for (let i = 0; i < data.length; i++) {
          // console.log(
          //   "lll: " + data[i]["itemId"]?.itemDescription,
          //   data[i]["itemId"]?.itemName
          // );
          data[i]["displayName"] =
            userProfileInfo[data[i]["userId"]]?.displayName;
          data[i]["itemDescription"] = data[i]["itemId"]?.itemDescription;
          data[i]["itemId"] = data[i]["itemId"]?.itemName;
          data[i]["taskData"] =
            firstTaskObject[data[i]["additionalDetails"]["processId"]];
        }
      } else {
        data = await this.serviceItemModel
          .findOne({ "additionalDetails.processId": processId })
          .populate({
            path: "itemId",
            populate: [
              {
                path: "platformItemId",
              },
            ],
          })
          .lean();
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  async getServiceItems(
    query: FilterItemRequestDTO,
    //accessToken: string,
    skip: number,
    limit: number,
    country_code: string = ""
  ) {
    try {
      // console.log("query", query);
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
      console.log("filter", filter);
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
        .sort({ priorityOrder: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const countData = await this.serviceItemModel.countDocuments(filter);
      const userIds = serviceItemData.map((e) => e.userId);
      const sourceIds = serviceItemData.map((e) => e.itemId._id.toString());
      if (country_code) {
        let itemListObjectWithUpdatedPrice = await this.getUpdatePrice(
          country_code,
          sourceIds
        );
        serviceItemData.map((data) => {
          if (itemListObjectWithUpdatedPrice[data.itemId._id.toString()]) {
            data.itemId["price"] =
              itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
                "price"
              ];
            data.itemId["comparePrice"] =
              itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
                "comparePrice"
              ];
            data.itemId["currency"] =
              itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
                "currency"
              ];
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

  async getServiceItemDetails(id: string, country_code: string = "", userId?) {
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
        parseInt(profileInfo[0]?.phoneNumber[9]) + 10 + totalFeedbacks?.count;
      data["ratingsData"] = ratingInfo.data;

      if (country_code) {
        let sourceIds = [];
        sourceIds.push(data.itemId._id);
        let itemListObjectWithUpdatedPrice = await this.getUpdatePrice(
          country_code,
          sourceIds
        );
        if (itemListObjectWithUpdatedPrice[data.itemId._id.toString()]) {
          data.itemId["price"] =
            itemListObjectWithUpdatedPrice[data.itemId._id.toString()]["price"];
          data.itemId["comparePrice"] =
            itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
              "comparePrice"
            ];
          data.itemId["currency"] =
            itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
              "currency"
            ];
        }
      }

      let newQuery = {
        skillId: data?.skill?.[0]
          ? data?.skill?.[0]?.skillId
          : data?.skill?.skillId,
        type: EserviceItemType.feedback,
      };
      let moreExpertsData = await this.getServiceItems(
        newQuery,
        0,
        500,
        country_code
      );

      const updatedMoreExpertsData = [];
      if (moreExpertsData.data.length > 0) {
        for (let i = 0; i < moreExpertsData?.data?.length; i++) {
          if (
            moreExpertsData?.data[i]?._id?.toString() != data?._id?.toString()
          ) {
            updatedMoreExpertsData.push({
              _id: moreExpertsData?.data[i]?._id,
              languages: moreExpertsData?.data[i]?.language,
              name: moreExpertsData?.data[i]?.profileData?.userName,
              media: moreExpertsData?.data[i]?.profileData?.media,
              is_verified: moreExpertsData?.data[i]?.profileData?.is_verified,
              about: moreExpertsData?.data[i]?.profileData?.about,
              tags: moreExpertsData?.data[i]?.profileData?.tags,
              ratings: moreExpertsData?.data[i]?.ratingData,
            });
          }
        }
      }
      if (data.type == EserviceItemType.feedback) {
        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.feedback_expert_detail_view;
        mixPanelBody.distinctId = userId;
        mixPanelBody.properties = {
          item_name: data.itemId.itemName,
          expert_name: data.profileData.displayName,
        };
        await this.helperService.mixPanel(mixPanelBody);
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
    limit: number,
    userId?: string,
    country_code?: string
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
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .sort({ priorityOrder: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      let currentUserWorkshops =
        await this.serviceRequestService.getUserRequests(
          EServiceRequestStatus.pending,
          userId,
          EserviceItemType.workShop
        );

      const countData = await this.serviceItemModel.countDocuments(filter);
      const userIds = serviceItemData.map((e) => e.userId);
      currentUserWorkshops.map((data) => {
        userIds.push(data.requestedToUser);
      });
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
      // let userIds = [];
      currentUserWorkshops.map((data) => {
        data["profileData"] = userProfileInfo[data.requestedToUser.toString()];
      });
      const sourceIds = serviceItemData.map((e) => e.itemId._id.toString());
      const itemsList = serviceItemData.map((e) => e.itemId);
      if (country_code) {
        let itemListObjectWithUpdatedPrice = await this.getUpdatePrice(
          country_code,
          sourceIds
        );
        serviceItemData.map((data) => {
          if (itemListObjectWithUpdatedPrice[data.itemId._id.toString()]) {
            data.itemId["price"] =
              itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
                "price"
              ];
            data.itemId["comparePrice"] =
              itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
                "comparePrice"
              ];
            data.itemId["currency"] =
              itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
                "currency"
              ];
          }
        });
      }

      return {
        data: serviceItemData,
        count: countData,
        currentWorkShops: currentUserWorkshops,
      };
    } catch (err) {
      throw err;
    }
  }

  async getworkShopServiceItemDetails(
    id: string,
    userId?: string,
    country_code?: string
  ) {
    try {
      var data: any = await this.serviceItemModel
        .findOne({ _id: id })
        .populate(
          "itemId",
          "itemName itemDescription additionalDetail price comparePrice orgId currency"
        )
        .lean();

      const profileInfo = await this.helperService.getworkShopProfileById(
        [data.userId],

        EprofileType.Expert
      );
      if (country_code) {
        let sourceIds = [];
        sourceIds.push(data.itemId._id);
        let itemListObjectWithUpdatedPrice = await this.getUpdatePrice(
          country_code,
          sourceIds
        );
        if (itemListObjectWithUpdatedPrice[data.itemId._id.toString()]) {
          data.itemId["price"] =
            itemListObjectWithUpdatedPrice[data.itemId._id.toString()]["price"];
          data.itemId["comparePrice"] =
            itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
              "comparePrice"
            ];
          data.itemId["currency"] =
            itemListObjectWithUpdatedPrice[data.itemId._id.toString()][
              "currency"
            ];
        }
      }
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

  async getProcessHomeSceenData(userId) {
    const serviceItemData = await this.serviceItemModel.aggregate([
      {
        $match: {
          type: EserviceItemType.courses,
          status: Estatus.Active,
        },
      },
      {
        $addFields: {
          tagNames: {
            $cond: {
              if: { $isArray: "$tag.name" },
              then: "$tag.name",
              else: ["$tag.name"],
            },
          },
        },
      },
      {
        $unwind: "$tagNames",
      },
      {
        $group: {
          _id: {
            tagName: "$tagNames",
            processId: "$additionalDetails.processId",
          },
          detail: { $first: "$additionalDetails" },
        },
      },
      {
        $sort: { priorityOrder: 1 },
      },
      {
        $group: {
          _id: "$_id.tagName",
          details: { $push: "$detail" },
        },
      },
      {
        $sort: { priorityOrder: 1 },
      },
      {
        $project: {
          _id: 0,
          tagName: "$_id",
          details: 1,
        },
      },
    ]);
    const finalData = serviceItemData.reduce((a, c) => {
      a[c.tagName] = c.details;
      return a;
    }, {});

    return finalData;
  }

  async getCourseHomeScreenData(userId) {
    try {
      const serviceItemData = await this.serviceItemModel.aggregate([
        {
          $match: {
            type: EserviceItemType.courses,
            status: Estatus.Active,
          },
        },
        {
          $addFields: {
            tagNames: {
              $cond: {
                if: { $isArray: "$tag.name" },
                then: "$tag.name",
                else: ["$tag.name"],
              },
            },
          },
        },
        {
          $unwind: "$tagNames",
        },
        {
          $group: {
            _id: {
              tagName: "$tagNames",
              processId: "$additionalDetails.processId",
            },
            detail: { $first: "$additionalDetails" },
            priorityOrder: { $first: "$priorityOrder" },
          },
        },
        {
          $sort: { priorityOrder: 1, _id: -1 },
        },
        {
          $group: {
            _id: "$_id.tagName",
            details: { $push: "$detail" },
          },
        },
        {
          $sort: { _id: -1 },
        },
        {
          $project: {
            _id: 0,
            tagName: "$_id",
            details: 1,
          },
        },
      ]);
      console.log("serviceItemData", JSON.stringify(serviceItemData));

      const subscriptionData =
        await this.subscriptionService.validateSubscription(userId, [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.failed,
        ]);
      const isNewSubscription = subscriptionData ? true : false;
      const finalData = serviceItemData.reduce((a, c) => {
        a[c.tagName] = c.details;
        return a;
      }, {});
      console.log("finalData", finalData);
      let systemConfiguration = await this.systemConfigurationModel.findOne({
        key: "remaind-button",
      });
      let remindButton = systemConfiguration?.value?.isRemind;
      // console.log("remindButton", remindButton);
      let referralConfig = await this.systemConfigurationModel.findOne({
        key: "referral_banners",
      });
      let learnHomePageBanner;
      let learnPageName;
      let premiumBanner;
      let pageName;
      let processId;
      if (referralConfig && Array.isArray(referralConfig.value)) {
        const bannerObj = referralConfig.value.find(
          (b) => b.banner === "learnhomepage"
        );
        learnHomePageBanner = bannerObj?.imageUrl;
        learnPageName = bannerObj?.screenName;
        const premiumBannerObj = referralConfig.value.find(
          (b) => b.banner === "buypremium"
        );
        premiumBanner = premiumBannerObj?.imageUrl;
        pageName = premiumBannerObj?.screenName;
        processId = premiumBannerObj?.processId;
      }
      // let featureCarouselData = {
      //   ListData: [],
      // };
      // let updatedSeriesForYouData = {
      //   ListData: [],
      // };
      let trendingSeriesData = {
        ListData: [],
      };
      let mostWatchedData = {
        ListData: [],
      };
      let dailyVocalExcersisesData = {
        ListData: [],
      };
      let stageAndMicData = {
        ListData: [],
      };
      let forYourVoiceData = {
        ListData: [],
      };
      let updatedUpcomingData = {
        ListData: [],
      };
      let allSeriesData = {
        ListData: [],
      };
      let processIds = [];
      // (finalData["SeriesForYou"] ?? []).map((data) =>
      //   processIds.push(data?.processId)
      // );
      // (finalData["featured"] ?? []).map((data) =>
      //   processIds.push(data?.processId)
      // );
      (finalData["trendingSeries"] ?? []).map((data) =>
        processIds.push(data?.processId)
      );
      (finalData["mostWatched"] ?? []).map((data) =>
        processIds.push(data?.processId)
      );
      (finalData["dailyVocalExcercises"] ?? []).map((data) =>
        processIds.push(data?.processId)
      );
      (finalData["stageAndMic"] ?? []).map((data) =>
        processIds.push(data?.processId)
      );
      (finalData["forYourVoice"] ?? []).map((data) =>
        processIds.push(data?.processId)
      );
      (finalData["upcomingseries"] ?? []).map((data) =>
        processIds.push(data?.processId)
      );
      (finalData["allSeries"] ?? []).map((data) =>
        processIds.push(data?.processId)
      );
      console.log("processIds", processIds);

      let firstTasks = await this.processService.getFirstTask(
        processIds,
        userId
      );
      console.log("firstTasks", firstTasks);

      // console.log("allSeriesData", allSeriesData);

      const firstTaskObject = firstTasks.reduce((a, c) => {
        a[c.processId] = c;
        return a;
      }, {});
      console.log("firstTaskObject", firstTaskObject);
      // (finalData["featured"] ?? []).map((data) => {
      //   featureCarouselData["ListData"].push({
      //     processId: data.processId,
      //     thumbnail: data.thumbnail,
      //     ctaName: data.ctaName,
      //     taskDetail: firstTaskObject[data.processId],
      //   });
      // });
      // (finalData["SeriesForYou"] ?? []).map((data) => {
      //   updatedSeriesForYouData["ListData"].push({
      //     processId: data.processId,
      //     thumbnail: data.thumbnail,
      //     taskDetail: firstTaskObject[data.processId],
      //   });
      // });
      (finalData["trendingSeries"] ?? []).map((data) => {
        trendingSeriesData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          ctaName: data.ctaName,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      (finalData["mostWatched"] ?? []).map((data) => {
        mostWatchedData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          ctaName: data.ctaName,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      (finalData["dailyVocalExcercises"] ?? []).map((data) => {
        dailyVocalExcersisesData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          ctaName: data.ctaName,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      (finalData["stageAndMic"] ?? []).map((data) => {
        stageAndMicData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          ctaName: data.ctaName,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      (finalData["forYourVoice"] ?? []).map((data) => {
        forYourVoiceData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          ctaName: data.ctaName,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      (finalData["upcomingseries"] ?? []).map((data) => {
        updatedUpcomingData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      (finalData["allSeries"] ?? []).map((data) => {
        allSeriesData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      let sections = [];
      let pendingProcessInstanceData =
        await this.processService.pendingProcess(userId);
      console.log("pendingProcessInstanceData", pendingProcessInstanceData);

      let continueWhereYouLeftData = {
        ListData: [],
      };
      if (pendingProcessInstanceData.length > 0) {
        let continueProcessIds = [];
        pendingProcessInstanceData.map((data) =>
          continueProcessIds.push(data?.processId)
        );
        let mentorUserIds = await this.getMentorUserIds(continueProcessIds);

        for (let i = 0; i < pendingProcessInstanceData.length; i++) {
          continueWhereYouLeftData["ListData"].push({
            thumbnail: await this.processService.getThumbNail(
              pendingProcessInstanceData[i].currentTask.taskMetaData?.media
            ),
            title: pendingProcessInstanceData[i].currentTask.taskTitle,
            ctaName: "Continue",
            progressPercentage: pendingProcessInstanceData[i].completed,
            navigationURL:
              "process/" +
              pendingProcessInstanceData[i].processId +
              "/task/" +
              pendingProcessInstanceData[i].currentTask._id,
            taskDetail: pendingProcessInstanceData[i].currentTask,
            mentorImage: mentorUserIds[i].media,
            mentorName: mentorUserIds[i].displayName,
            seriesTitle: mentorUserIds[i].seriesName,
            seriesThumbNail: mentorUserIds[i].seriesThumbNail,
          });
        }
      }
      console.log("continueWhereYouLeftData", continueWhereYouLeftData);

      sections.push({
        data: {
          headerName: Eheader.continue,
          listData: continueWhereYouLeftData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ActiveProcessList,
      });

      if (
        isNewSubscription === false &&
        continueWhereYouLeftData.ListData.length === 1
      ) {
        sections.push({
          data: {
            listData: [],
            banner: premiumBanner,
            screenName: pageName,
            processId: processId,
          },
          horizontalScroll: true,
          componentType: EcomponentType.ColThumbnailList,
        });
      }
      // sections.push({
      //   data: {
      //     listData: featureCarouselData["ListData"],
      //   },
      //   horizontalScroll: true,
      //   componentType: EcomponentType.feature,
      // }),
      // sections.push({
      //   data: {
      //     headerName: Eheader.mySeries,
      //     listData: updatedSeriesForYouData["ListData"],
      //   },
      //   horizontalScroll: true,
      //   componentType: EcomponentType.ColThumbnailList,
      // });
      // sections.push({
      //   data: {
      //     listData: featureCarouselData["ListData"],
      //   },
      //   horizontalScroll: true,
      //   componentType: EcomponentType.feature,
      // }),

      sections.push({
        data: {
          headerName: Eheader.trendingSeries,
          listData: trendingSeriesData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ColThumbnailList,
      });
      sections.push({
        data: {
          headerName: Eheader.mostWatched,
          listData: mostWatchedData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ColThumbnailList,
      });
      sections.push({
        data: {
          headerName: Eheader.dailyVocalExcercises,
          listData: dailyVocalExcersisesData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ColThumbnailList,
      });
      if (isNewSubscription === true) {
        sections.push({
          data: {
            listData: [],
            banner: learnHomePageBanner,
            screenName: learnPageName,
          },
          horizontalScroll: true,
          componentType: EcomponentType.ColThumbnailList,
        });
      }
      sections.push({
        data: {
          headerName: Eheader.stageAndMic,
          listData: stageAndMicData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ColThumbnailList,
      });
      sections.push({
        data: {
          headerName: Eheader.forYourVoice,
          listData: forYourVoiceData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ColThumbnailList,
      });
      sections.push({
        data: {
          headerName: Eheader.allSeries,
          listData: allSeriesData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ColThumbnailList,
      });
      sections.push({
        data: {
          headerName: Eheader.upcoming,
          listData: updatedUpcomingData["ListData"],
        },
        horizontalScroll: true,
        isRemind: remindButton,
        componentType: EcomponentType.ColThumbnailList,
      });

      let data = {};
      data["sections"] = sections;

      let finalResponse = {
        status: 200,
        message: "success",
        data: data,
      };
      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.learn_homepage_success;
      mixPanelBody.distinctId = userId;
      mixPanelBody.properties = {};
      await this.helperService.mixPanel(mixPanelBody);
      return finalResponse;
    } catch (err) {
      throw err;
    }
  }

  async getMentorUserIds(processId) {
    try {
      let mentorUserIds: any = await this.serviceItemModel
        .find(
          {
            type: "courses",
            "additionalDetails.processId": { $in: processId },
            status: Estatus.Active,
          },
          { userId: 1, additionalDetails: 1 }
        )
        .populate("itemId")
        .lean();
      const seriesInfoObj = mentorUserIds.reduce((a, c) => {
        a[c.additionalDetails.processId] = c;
        return a;
      }, {});

      const userInfoObj = mentorUserIds.reduce((a, c) => {
        a[c.additionalDetails.processId] = c.userId;
        return a;
      }, {});

      let userIds = [];
      for (let i = 0; i < mentorUserIds.length; i++) {
        userIds.push(mentorUserIds[i].userId.toString());
      }
      const profileInfo = await this.helperService.getProfileByIdTl(
        userIds,
        EprofileType.Expert
      );
      const profileInfoObj = profileInfo.reduce((a, c) => {
        a[c.userId] = c;
        return a;
      }, {});
      let mentorProfiles = [];
      for (let i = 0; i < processId.length; i++) {
        mentorProfiles.push({
          processId: processId[i],
          userId: userInfoObj[processId[i]],
          displayName: profileInfoObj[userInfoObj[processId[i]]]?.displayName,
          media: profileInfoObj[userInfoObj[processId[i]]]?.media,
          seriesName: seriesInfoObj[processId[i]].itemId.itemName,
          seriesThumbNail:
            seriesInfoObj[processId[i]].additionalDetails.thumbnail,
        });
      }
      return mentorProfiles;
    } catch (err) {
      throw err;
    }
  }

  async getPlanDetails(processId, country_code: string = "", userId?) {
    try {
      let processPricingData: any = await this.serviceItemModel
        .findOne({ "additionalDetails.processId": processId })
        .populate("itemId")
        .lean();

      let subscriptionItemIds = await this.serviceItemModel
        .find({ type: EserviceItemType.subscription })
        .sort({ _id: 1 });
      let ids = [];
      subscriptionItemIds.map((data) => ids.push(new ObjectId(data.itemId)));
      let plandata: any = await this.itemService.getItemsDetails(ids);
      if (country_code) {
        ids.push(new ObjectId(processPricingData.itemId._id));
        let priceListData = await this.getPriceListItems(ids, country_code);
        plandata.forEach((e) => {
          let currData = priceListData[e._id.toString()];
          if (currData) {
            e["price"] = currData["price"];
            e["comparePrice"] = currData["comparePrice"];
            e["currency"] = currData["currency"];
          }
        });
        let processPrice = priceListData[processPricingData.itemId._id];
        if (processPrice) {
          processPricingData.itemId["price"] = processPrice["price"];
          processPricingData.itemId["comparePrice"] =
            processPrice["comparePrice"];
          processPricingData.itemId["currency"] = processPrice["currency"];
        }
      }
      let finalResponse = {};
      let featuresArray = [];
      featuresArray.push({
        feature: "",
        values: ["THIS SERIES", plandata[1].itemName, plandata[0].itemName],
      });
      for (
        let i = 0;
        i < plandata[0].additionalDetail.planDetails.length;
        i++
      ) {
        let feature = plandata[0].additionalDetail.planDetails[i].feature;
        let values = [
          processPricingData.itemId.additionalDetail.planDetails[i].value,
          plandata[1].additionalDetail.planDetails[i].value,
          plandata[0].additionalDetail.planDetails[i].value,
        ];
        featuresArray.push({ feature: feature, values: values });
      }
      let planIds = [
        null,
        plandata[1].additionalDetail.planId,
        plandata[0].additionalDetail.planId,
      ];
      let headings = [
        "THIS SERIES",
        plandata[1].itemName,
        plandata[0].itemName,
      ];
      let actualPrice = [
        processPricingData.itemId.price,
        plandata[1].price,
        plandata[0].price,
      ];
      let currencyCode = [
        processPricingData.itemId.currency.currency_code,
        plandata[1].currency.currency_code,
        plandata[0].currency.currency_code,
      ];
      let itemId = [
        processPricingData.itemId._id,
        plandata[1]._id,
        plandata[0]._id,
      ];
      let comparePrice = [
        processPricingData.itemId.comparePrice,
        plandata[1].comparePrice,
        plandata[0].comparePrice,
      ];
      let badgeColour = [
        processPricingData.itemId.additionalDetail.badgeColour,
        plandata[1].additionalDetail.badgeColour,
        plandata[0].additionalDetail.badgeColour,
      ];
      let keys = [
        "casttree",
        plandata[1].additionalDetail.key,
        plandata[0].additionalDetail.key,
      ];
      let validity = [
        processPricingData.itemId.additionalDetail.validity,
        plandata[1].additionalDetail.validity,
        plandata[0].additionalDetail.validity,
      ];
      let planDetailsArray = [];
      for (let i = 0; i < headings.length; i++) {
        planDetailsArray.push({
          key: keys[i],
          heading: headings[i],
          planIds: planIds[i],
          actualPrice: actualPrice[i],
          comparePrice: comparePrice[i],
          badgeColour: badgeColour[i],
          expiry: validity[i],
          itemId: itemId[i],
          currencyCode: currencyCode[i],
        });
      }
      finalResponse["planData"] = planDetailsArray;
      finalResponse["featuresData"] = featuresArray;

      return finalResponse;
    } catch (err) {
      throw err;
    }
  }
  async getServuceItemDetailsByProcessId(processId) {
    try {
      let data = await this.serviceItemModel.findOne({
        "additionalDetails.processId": processId,
      });
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getSubscriptionPlanDetails(country_code: string = "", userId?) {
    try {
      let subscriptionItemIds = await this.serviceItemModel
        .find({ type: EserviceItemType.subscription })
        .sort({ _id: 1 });
      let ids = [];
      subscriptionItemIds.map((data) => ids.push(new ObjectId(data.itemId)));
      let plandata: any = await this.itemService.getItemsDetails(ids);
      if (country_code) {
        let itemListObjectWithUpdatedPrice = await this.getUpdatePrice(
          country_code,
          ids
        );
        plandata.map((data) => {
          if (itemListObjectWithUpdatedPrice[data._id.toString()]) {
            data["price"] =
              itemListObjectWithUpdatedPrice[data._id.toString()]["price"];
            data["comparePrice"] =
              itemListObjectWithUpdatedPrice[data._id.toString()][
                "comparePrice"
              ];
            data["currency"] =
              itemListObjectWithUpdatedPrice[data._id.toString()]["currency"];
          }
        });
      }
      let finalResponse = {};
      let featuresArray = [];
      featuresArray.push({
        feature: "",
        values: [plandata[1].itemName, plandata[0].itemName],
      });
      for (
        let i = 0;
        i < plandata[0].additionalDetail.planDetails.length;
        i++
      ) {
        let feature = plandata[0].additionalDetail.planDetails[i].feature;
        let values = [
          plandata[1].additionalDetail.planDetails[i].value,
          plandata[0].additionalDetail.planDetails[i].value,
        ];
        featuresArray.push({ feature: feature, values: values });
      }
      let planIds = [
        plandata[1].additionalDetail.planId,
        plandata[0].additionalDetail.planId,
      ];
      let headings = [plandata[1].itemName, plandata[0].itemName];
      let actualPrice = [plandata[1].price, plandata[0].price];
      let currencyCode = [
        plandata[1].currency.currency_code,
        plandata[0].currency.currency_code,
      ];
      let itemId = [plandata[1]._id, plandata[0]._id];
      let comparePrice = [plandata[1].comparePrice, plandata[0].comparePrice];
      let badgeColour = [
        plandata[1].additionalDetail.badgeColour,
        plandata[0].additionalDetail.badgeColour,
      ];
      let keys = [
        plandata[1].additionalDetail.key,
        plandata[0].additionalDetail.key,
      ];
      let validity = [
        plandata[1].additionalDetail.validity,
        plandata[0].additionalDetail.validity,
      ];
      let planDetailsArray = [];
      for (let i = 0; i < headings.length; i++) {
        planDetailsArray.push({
          key: keys[i],
          heading: headings[i],
          planIds: planIds[i],
          actualPrice: actualPrice[i],
          comparePrice: comparePrice[i],
          badgeColour: badgeColour[i],
          expiry: validity[i],
          itemId: itemId[i],
          currencyCode: currencyCode[i],
        });
      }
      finalResponse["planData"] = planDetailsArray;
      finalResponse["featuresData"] = featuresArray;

      return finalResponse;
    } catch (err) {
      throw err;
    }
  }

  async getPromotionDetails(processId, country_code: string = "", userId?) {
    try {
      let subscriptionData;
      let mandateData;
      let userCountryCode;
      let userData;
      if (userId) {
        subscriptionData = await this.subscriptionService.validateSubscription(
          userId,
          [EsubscriptionStatus.initiated, EsubscriptionStatus.failed]
        );
        mandateData = await this.mandateService.getMandateByProvider(userId);
      }
      // console.log("mandateData", mandateData);
      const isNewSubscription = subscriptionData ? true : false;
      let finalResponse = [];
      let processPricingData: any = await this.serviceItemModel
        .findOne({ "additionalDetails.processId": processId })
        .populate("itemId")
        .lean();
      let userIds = [];
      userIds.push(processPricingData.userId);
      const profileInfo = await this.helperService.getProfileByIdTl(
        userIds,
        EprofileType.Expert
      );
      const profileInfoObj = profileInfo.reduce((a, c) => {
        a[c.userId] = c;
        return a;
      }, {});
      processPricingData["profileData"] =
        profileInfoObj[processPricingData.userId.toString()];
      let subscriptionItemIds = await this.serviceItemModel
        .find({ type: EserviceItemType.subscription })
        .sort({ _id: 1 });
      let ids = [];
      subscriptionItemIds.map((data) => ids.push(new ObjectId(data.itemId)));
      let plandata: any = await this.itemService.getItemsDetails(ids);
      plandata.reverse();
      ids.push(new ObjectId(processPricingData.itemId._id));
      if (country_code) {
        let itemListObjectWithUpdatedPrice = await this.getUpdatePrice(
          country_code,
          ids
        );
        console.log(
          "itemListObjectWithUpdatedPrice",
          itemListObjectWithUpdatedPrice
        );

        // Check if price lookup was successful
        if (
          !itemListObjectWithUpdatedPrice ||
          Object.keys(itemListObjectWithUpdatedPrice).length === 0
        ) {
          console.warn(
            "Price lookup failed for country_code:",
            country_code,
            "- using default prices"
          );
        }

        plandata.map((data) => {
          if (
            itemListObjectWithUpdatedPrice &&
            itemListObjectWithUpdatedPrice[data._id.toString()]
          ) {
            data["price"] =
              itemListObjectWithUpdatedPrice[data._id.toString()]["price"];
            data["comparePrice"] =
              itemListObjectWithUpdatedPrice[data._id.toString()][
                "comparePrice"
              ];
            data["currency"] =
              itemListObjectWithUpdatedPrice[data._id.toString()]["currency"];
          }
          // If price lookup failed, data retains its original prices from database
        });

        let processPrice =
          itemListObjectWithUpdatedPrice &&
          itemListObjectWithUpdatedPrice[processPricingData.itemId._id];
        if (processPrice) {
          processPricingData.itemId["price"] = processPrice["price"];
          processPricingData.itemId["comparePrice"] =
            processPrice["comparePrice"];
          processPricingData.itemId["currency"] = processPrice["currency"];
        } else {
          console.warn(
            "No price data found for processPricingData.itemId:",
            processPricingData.itemId._id,
            "- using default prices"
          );
        }
      }
      // console.log("processPricingData",processPricingData?.itemId);

      if (processPricingData?.itemId?.additionalDetail?.promotionDetails) {
        processPricingData.itemId.additionalDetail.promotionDetails.price =
          processPricingData.itemId.price;
        processPricingData.itemId.additionalDetail.promotionDetails.itemName =
          processPricingData.itemId.itemName;
        processPricingData.itemId.additionalDetail.promotionDetails.mentorName =
          processPricingData.profileData?.displayName;
        processPricingData.itemId.additionalDetail.promotionDetails.thumbnail =
          processPricingData.additionalDetails.thumbnail;
        processPricingData.itemId.additionalDetail.promotionDetails.itemId =
          processPricingData.itemId._id;
        processPricingData.itemId.additionalDetail.promotionDetails.comparePrice =
          processPricingData.itemId.comparePrice;
        processPricingData.itemId.additionalDetail.promotionDetails.currency_code =
          processPricingData.itemId.currency.currency_code;
        const promoDetails =
          processPricingData.itemId.additionalDetail.promotionDetails;

        // Handle payWallVideo based on subscription status
        if (isNewSubscription === true) {
          // For new subscribers, use payWallVideo if it exists
          if (promoDetails["payWallVideo"]) {
            promoDetails.payWallVideo = promoDetails["payWallVideo"];
          }
        } else {
          // For existing subscribers, use payWallVideo1 if it exists, otherwise fallback to payWallVideo
          if (promoDetails["payWallVideo1"]) {
            promoDetails.payWallVideo = promoDetails["payWallVideo1"];
          } else if (promoDetails["payWallVideo"]) {
            promoDetails.payWallVideo = promoDetails["payWallVideo"];
          }
        }

        // Clean up payWallVideo1 after processing
        if (promoDetails["payWallVideo1"]) {
          delete promoDetails["payWallVideo1"];
        }

        processPricingData.itemId.additionalDetail.promotionDetails.bottomSheet =
          processPricingData.itemId.bottomSheet;
        finalResponse.push(
          processPricingData.itemId.additionalDetail.promotionDetails
        );
      }
      plandata.map((data) => {
        data.additionalDetail.promotionDetails.comparePrice = data.comparePrice;
        data.additionalDetail.promotionDetails.itemId = data._id;
        data.additionalDetail.promotionDetails.itemName = data.itemName;
        data.additionalDetail.promotionDetails.price = data.price;
        data.additionalDetail.promotionDetails.currency_code =
          data.currency?.currency_code;
        data.additionalDetail.promotionDetails.planId =
          data.additionalDetail?.planId;
        data.additionalDetail.promotionDetails.isNewSubscriber =
          subscriptionData ? false : true;
        data.additionalDetail.promotionDetails.planConfig =
          data.additionalDetail?.planConfig;
        data.additionalDetail.promotionDetails.mandates = mandateData?.mandate
          ?.mandates.length
          ? mandateData?.mandate?.mandates
          : [];
        data.additionalDetail.promotionDetails.bottomSheet =
          data.additionalDetail?.bottomSheet;
        // console.log("bottom sheet is",data.additionalDetail?.bottomSheet );

        finalResponse.push(data.additionalDetail.promotionDetails);
      });
      finalResponse.sort((a, b) => {
        // Detect "this series" dynamically (any plan that is NOT PRO or SUPER PRO)
        const isThisSeries = (plan) =>
          plan.itemName !== "PRO" && plan.itemName !== "SUPER PRO";

        if (isThisSeries(a)) return -1;
        if (isThisSeries(b)) return 1;

        // Second, PRO 99 plan
        if (a.itemName === "PRO" && a.price === 99) return -1;
        if (b.itemName === "PRO" && b.price === 99) return 1;

        // Keep other plans in the existing order
        return 0;
      });

      return finalResponse;
    } catch (err) {
      throw err;
    }
  }

  async getPremiumDetails(country_code: string = "", userId?) {
    try {
      let subscriptionItemIds: any = await this.serviceItemModel
        .find({ type: EserviceItemType.subscription })
        .sort({ _id: 1 })
        .lean();
      let ids = [];
      subscriptionItemIds.map((data) => ids.push(new ObjectId(data.itemId)));
      let plandata: any = await this.itemService.getItemsDetails(ids);
      if (country_code) {
        let itemListObjectWithUpdatedPrice = await this.getUpdatePrice(
          country_code,
          ids
        );
        plandata.map((data) => {
          if (itemListObjectWithUpdatedPrice[data._id]) {
            data["price"] =
              itemListObjectWithUpdatedPrice[data._id.toString()]["price"];
            data["comparePrice"] =
              itemListObjectWithUpdatedPrice[data._id.toString()][
                "comparePrice"
              ];
            data["currency"] =
              itemListObjectWithUpdatedPrice[data._id.toString()]["currency"];
          }
        });
      }
      let finalResponse = [];
      plandata.map((data) => {
        finalResponse.push(data.additionalDetail.premiumPage);
      });
      for (let i = 0; i < finalResponse.length; i++) {
        finalResponse[i].price = plandata[i].price;
        finalResponse[i].comparePrice = plandata[i].comparePrice;
        finalResponse[i].currency_code = plandata[i].currency.currency_code;
      }

      return finalResponse;
    } catch (err) {
      throw err;
    }
  }
  async getUpdatePrice(country_code: string, itemIds: string[]) {
    try {
      const uniqueArray = [
        ...new Set(itemIds.map((id) => new mongoose.Types.ObjectId(id))),
      ];
      let priceListData = await this.getPriceListItems(
        uniqueArray,
        country_code
      );
      return priceListData;
    } catch (err) {
      console.error(
        "Price lookup failed for country_code:",
        country_code,
        "itemIds:",
        itemIds,
        "Error:",
        err
      );
      return {}; // Return empty object instead of undefined
    }
  }
  async getServiceItemType(itemId: string) {
    try {
      const type = await this.serviceItemModel.findOne({
        itemId: new mongoose.Types.ObjectId(itemId),
      });
      // console.log("type", type);
      return type;
    } catch (error) {
      throw error;
    }
  }
  async getServiceItem() {
    try {
      const query = { type: EserviceItemType.courses, status: Estatus.Active };
      const serviceItemData: any = await this.serviceItemModel
        .find(query)
        .populate({
          path: "itemId",
          select: "itemName itemDescription",
        })
        .sort({ priorityOrder: 1 })
        .lean();
      const processIds = serviceItemData
        .filter((item) => item.additionalDetails?.processId)
        .map((item) => item.additionalDetails.processId);

      const firstTasks = await this.processService.getFirstTask(
        processIds,
        null
      );
      let count = firstTasks.filter((task) => task.isLocked !== true).length;
      const firstTaskData = firstTasks.reduce((acc, task) => {
        acc[task.processId] = task;
        return acc;
      }, {});

      const filteredData = serviceItemData
        .map((item) => {
          const firstTask =
            item.additionalDetails?.processId &&
            firstTaskData[item.additionalDetails.processId]
              ? firstTaskData[item.additionalDetails.processId]
              : null;
          const isTrendingSeries =
            Array.isArray(item?.tag) &&
            item.tag.some((t) => t.name === EItemTag.trendingSeries);
          return {
            thumbnail: item.additionalDetails?.thumbnail,
            itemName: item.itemId?.itemName,
            processId: item.additionalDetails?.processId,
            taskId: firstTask?._id,
            taskDetails: firstTask?.taskMetaData,
            title: firstTask?.title,
            isLocked: firstTask?.isLocked,
            itemDesc: item.itemId?.itemDescription,
            tag: item?.tag,
            isTrendingSeries,
          };
        })
        .filter(
          (item) =>
            item.isLocked !== true &&
            !(
              Array.isArray(item.tag) &&
              item.tag.some((t) => t.name === EItemTag.upcomingseries)
            )
        );
      return { data: filteredData, count: count };
    } catch (error) {
      throw error;
    }
  }
  async getPromotionDetailsV2(processId: string) {
    try {
      let serviceItem: any = await this.serviceItemModel
        .findOne({
          status: Estatus.Active,
          "additionalDetails.processId": new ObjectId(processId),
        })
        .populate("itemId");
      let provider = await this.systemConfigurationModel.findOne({
        key: ESystemConfigurationKeyName.subscription_payment_provider,
      });
      let finalResponse = {
        payWallVideo: (serviceItem?.itemId as any)?.additionalDetail
          ?.promotionDetails?.payWallVideo,
        authInfo:
          serviceItem?.itemId?.additionalDetail?.promotionDetails?.authDetail,
        subscriptionInfo:
          serviceItem?.itemId?.additionalDetail?.promotionDetails
            ?.subscriptionDetail,
        premiumThumbnails:
          serviceItem?.itemId?.additionalDetail?.promotionDetails
            ?.premiumThumbnails,
        provider: provider?.value?.provider,
        provideId: provider?.value?.providerId,
        itemId: serviceItem?.planItemId?.[0]?.itemId,
        itemName: serviceItem?.itemId?.itemName,
        price: serviceItem?.itemId?.price,
        currency_code: serviceItem?.itemId?.currency?.currency_code,
        comparePrice: serviceItem?.itemId?.comparePrice,
      };
      return { data: finalResponse };
    } catch (error) {
      throw error;
    }
  }
  async getContestDetailBySkillId(userId: string) {
    try {
      const profileArr = await this.helperService.getProfileByIdTl([userId]);
      const profile = Array.isArray(profileArr) ? profileArr[0] : profileArr;
      const userRoleIds = (profile?.roles || []).map(
        (role) => new ObjectId(role._id)
      );
      // console.log("userRoleIds is", userRoleIds);
      const skills = await this.serviceItemModel.aggregate([
        {
          $match: {
            type: EserviceItemType.contest,
            status: Estatus.Active,
            "skill.skillId": { $exists: true, $ne: null },
          },
        },
        {
          $lookup: {
            from: "skills",
            localField: "skill.skillId",
            foreignField: "_id",
            as: "skillDetails",
          },
        },
        {
          $unwind: {
            path: "$skillDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "systemConfiguration",
            let: { key: "contest_skill_image" },
            pipeline: [
              { $match: { key: "contest_skill_image" } },
              { $project: { _id: 0, value: 1 } },
            ],
            as: "contestConfig",
          },
        },
        {
          $unwind: {
            path: "$contestConfig",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$skillDetails._id",
            skillId: { $first: "$skillDetails._id" },
            skillName: { $first: "$skillDetails.skill_name" },
            skillRoles: { $first: "$skillDetails.role" },
            contestSkillImage: { $first: "$contestConfig.value.media" },
          },
        },
        {
          $addFields: {
            mediaUrl: {
              $let: {
                vars: {
                  matchedMedia: {
                    $filter: {
                      input: "$contestSkillImage",
                      cond: {
                        $eq: [
                          { $toLower: "$$this.name" },
                          { $toLower: "$skillName" },
                        ],
                      },
                    },
                  },
                },
                in: { $arrayElemAt: ["$$matchedMedia.mediaUrl", 0] },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            skillId: 1,
            skillName: 1,
            mediaUrl: 1,
            skillRoles: 1,
          },
        },
      ]);

      if (userRoleIds.length === 0) {
        const skillsWithoutRoles = skills.map(
          ({ skillRoles, ...skill }) => skill
        );
        return { data: skillsWithoutRoles };
      }

      const { matchingSkills, nonMatchingSkills } =
        this.categorizeSkillsByUserRoles(skills, userRoleIds);
      return { data: [...matchingSkills, ...nonMatchingSkills] };
    } catch (error) {
      throw error;
    }
  }

  async getTrendingSeries(
    skip: number,
    limit: number,
    userId: string,
    country_code: string = ""
  ) {
    try {
      const filter = this.buildTrendingSeriesFilter();
      const aggregationPipeline = this.buildAggregationPipeline(
        filter,
        skip,
        limit
      );
      const countPipeline = this.buildCountPipeline(filter);
      const [serviceItemData, totalCount] = await Promise.all([
        this.serviceItemModel.aggregate(aggregationPipeline),
        this.serviceItemModel.aggregate(countPipeline),
      ]);
      const count = totalCount.length > 0 ? totalCount[0].count : 0;

      // Extract process IDs and fetch first tasks
      const processIds = serviceItemData
        .map((item) => item.additionalDetails?.processId)
        .filter(Boolean);

      const firstTasks = await this.processService.getFirstTask(
        processIds,
        userId
      );

      // Create task mapping and enrich data
      const taskMap = this.createTaskMap(firstTasks);
      const enrichedData = serviceItemData.map((item) => {
        const matchingTask = taskMap.get(
          item.additionalDetails?.processId?.toString()
        );
        return {
          ...item.additionalDetails,
          taskDetail: matchingTask || null,
        };
      });

      const result = { data: enrichedData, count };

      return result;
    } catch (err) {
      console.error("Error in getTrendingSeries:", err);
      throw err;
    }
  }

  private buildTrendingSeriesFilter() {
    return {
      type: EserviceItemType.courses,
      tag: {
        $elemMatch: { name: EServiceItemTag.trendingSeries },
      },
      status: Estatus.Active,
    };
  }

  private buildAggregationPipeline(
    filter: any,
    skip: number,
    limit: number
  ): any[] {
    // Simplified pipeline for debugging
    return [
      { $match: filter },
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          additionalDetails: 1,
          tag: 1,
          priorityOrder: 1,
        },
      },
    ];
  }

  private buildCountPipeline(filter: any): any[] {
    return [
      { $match: filter },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ];
  }
  private createTaskMap(firstTasks: any[]): Map<string, any> {
    return new Map(firstTasks.map((task) => [task.processId.toString(), task]));
  }
  private categorizeSkillsByUserRoles(
    skills: any[],
    userRoleIds: any[]
  ): {
    matchingSkills: any[];
    nonMatchingSkills: any[];
  } {
    const matchingSkills: any[] = [];
    const nonMatchingSkills: any[] = [];

    const userRoleIdSet = new Set(userRoleIds.map((id) => id.toString()));

    for (const skill of skills) {
      const skillRoles = skill.skillRoles || [];
      const isMatchingRole = userRoleIds.some((userRoleId) =>
        skillRoles.some(
          (skillRole) => skillRole.toString() === userRoleId.toString()
        )
      );

      const { skillRoles: _, ...skillWithoutRoles } = skill;

      if (isMatchingRole) {
        matchingSkills.push(skillWithoutRoles);
      } else {
        nonMatchingSkills.push(skillWithoutRoles);
      }
    }

    return { matchingSkills, nonMatchingSkills };
  }
  async getPromotionDetailByItemId(
    itemId: string,
    token: UserToken,
    country_code: string = "",
    userId?: string,
    apiVersion?: string
  ) {
    try {
      if (apiVersion === "2") {
        const [promotionPage, subscriptionData] = await Promise.all([
          this.getPromotionPage(token?.phoneNumber),
          userId
            ? this.subscriptionService.validateSubscription(userId, [
                EsubscriptionStatus.initiated,
                EsubscriptionStatus.failed,
              ])
            : Promise.resolve(null),
        ]);

        const serviceItemFilter: any = {
          itemId: new ObjectId(itemId),
          status: Estatus.Active,
        };


        const processPricingData: any = await this.serviceItemModel
          .findOne(serviceItemFilter)
          .populate("itemId")
          .populate({
            path: "planItemId",
            populate: {
              path: "itemId",
              model: "item",
            },
          })
          .lean();
  
        if (!processPricingData) {
          return null;
        }

        const planItems = Array.isArray(processPricingData?.planItemId)
          ? processPricingData.planItemId
          : [];

        if (planItems.length === 0) {
          return [];
        }

        const planItemIds =
          planItems
            .map((plan) => plan?.itemId?._id)
            .filter(Boolean)
            .map((id) => new ObjectId(id)) ?? [];

        if (planItemIds.length === 0) {
          return [];
        }

        const [profileInfo, updatedPriceMap] = await Promise.all([
          processPricingData?.userId
            ? this.helperService.getProfileByIdTl(
                [processPricingData.userId],
                EprofileType.Expert
              )
            : Promise.resolve([]),
          country_code
            ? this.getUpdatePrice(
                country_code,
                planItemIds.map((id) => id.toString())
              )
            : Promise.resolve({}),
        ]);

        const profileInfoObj = Array.isArray(profileInfo)
          ? profileInfo.reduce((acc, current) => {
              acc[current.userId] = current;
              return acc;
            }, {})
          : {};

        processPricingData["profileData"] =
          profileInfoObj[processPricingData?.userId?.toString()];

        const isNewSubscription = !subscriptionData;
        const itemPromoDetails =
          processPricingData?.itemId?.additionalDetail?.promotionDetails || {};
        const skillName =
          processPricingData?.skill?.[0]?.skill_name ||
          processPricingData?.skill?.skill_name ||
          "";
        const mentorName = processPricingData?.profileData?.displayName || "";
        const skipText =
          processPricingData?.itemId?.additionalDetail?.skipText || "";

        const baseContext = {
          mentorName,
          skipText,
          skillName,
          isNewSubscription,
          itemPromoDetails,
          itemDescription: processPricingData?.itemId?.itemDescription || "",
        };

        const finalResponseWithOrder = planItems.reduce(
          (acc: any[], plan: any, index: number) => {
            const planItem = plan?.itemId;
            if (!planItem?._id) {
              return acc;
            }

            const updatedPrice =
              updatedPriceMap?.[planItem._id.toString()] || null;

            if (updatedPrice) {
              planItem.price = updatedPrice.price;
              planItem.comparePrice = updatedPrice.comparePrice;
              planItem.currency = updatedPrice.currency;
            }

            const combinedPromoDetail = this.buildPlanPromotionDetail(
              planItem,
              baseContext
            );

            if (combinedPromoDetail) {
              acc.push({
                ...combinedPromoDetail,
                __planOrder: typeof plan?.order === "number" ? plan.order : index,
              });
            }
            return acc;
          },
          []
        );

        const finalResponse = finalResponseWithOrder
          .sort(
            (a, b) =>
              (a?.__planOrder ?? 0) - (b?.__planOrder ?? 0)
          )
          .map(({ __planOrder, ...rest }) => rest);

        const normalizedType = processPricingData?.type || EPayWallType.courses;
        const typeSpecificPayload = this.formatPromotionDetailsByType(
          finalResponse,
          normalizedType
        );

        return {
          payWall: {
            ...typeSpecificPayload,
          type: {
            page: promotionPage,
          },
          }
        };
      }

      if (apiVersion !== "2") {
        let subscriptionData;
        let mandateData;

        if (userId) {
          subscriptionData =
            await this.subscriptionService.validateSubscription(userId, [
              EsubscriptionStatus.initiated,
              EsubscriptionStatus.failed,
            ]);
          mandateData = await this.mandateService.getMandateByProvider(userId);
        }

        const isNewSubscription = subscriptionData ? true : false;
        let finalResponse: any[] = [];
        // console.log("item id is",itemId);

        let processPricingData: any = await this.serviceItemModel
          .findOne({ itemId: new ObjectId(itemId), status: Estatus.Active })
          .populate("itemId")
          .populate({
            path: "planItemId",
            populate: {
              path: "itemId",
              model: "item",
            },
          })
          .lean();
        // console.log("processPricingData", processPricingData);

        let userIds = [];
        userIds.push(processPricingData?.userId);
        const profileInfo = await this.helperService.getProfileByIdTl(
          userIds,
          EprofileType.Expert
        );
        const profileInfoObj = profileInfo.reduce((a, c) => {
          a[c.userId] = c;
          return a;
        }, {});
        processPricingData["profileData"] =
          profileInfoObj[processPricingData?.userId?.toString()];

        let subscriptionItemIds = await this.serviceItemModel
          .find({ type: EserviceItemType.subscription })
          .sort({ _id: 1 });
        let ids = [];
        subscriptionItemIds.map((data) => ids.push(new ObjectId(data?.itemId)));
        // console.log("ids is ==>",ids);

        let plandata: any = await this.itemService.getItemsDetails(ids);
        // console.log("plan data is",plandata);

        // plandata.reverse();

        // console.log("plan data reversed is",plandata);
        // ids.push(new ObjectId(processPricingData?.planItemId?.[0]?.itemId?._id));
        let planItem = processPricingData?.planItemId?.[0]?.itemId;
        // console.log("planItem",planItem);
        if (planItem) {
          ids.push(new ObjectId(planItem?._id));
        }
        // console.log("ids", ids);
        if (country_code) {
          // console.log("country_code", country_code);
          let itemListObjectWithUpdatedPrice = await this.getUpdatePrice(
            country_code,
            ids
          );

          plandata.map((data) => {
            if (
              itemListObjectWithUpdatedPrice &&
              itemListObjectWithUpdatedPrice[data?._id?.toString()]
            ) {
              data["price"] =
                itemListObjectWithUpdatedPrice[data?._id?.toString()]["price"];
              data["comparePrice"] =
                itemListObjectWithUpdatedPrice[data?._id?.toString()][
                  "comparePrice"
                ];
              data["currency"] =
                itemListObjectWithUpdatedPrice[data?._id?.toString()][
                  "currency"
                ];
            }
            // If price lookup failed, data retains its original prices from database
          });

          // Update planItem pricing based on country code
          if (planItem && planItem._id) {
            let processPrice =
              itemListObjectWithUpdatedPrice &&
              itemListObjectWithUpdatedPrice[planItem._id.toString()];
            if (processPrice) {
              planItem["price"] = processPrice["price"];
              planItem["comparePrice"] = processPrice["comparePrice"];
              planItem["currency"] = processPrice["currency"];
            } else {
              console.warn(
                "No price data found for planItem:",
                planItem._id,
                "- using default prices"
              );
            }
          }
        }
        // console.log("planItem", processPricingData);

        if (
          processPricingData?.planItemId?.[0]?.itemId?.additionalDetail
            ?.promotionDetails
        ) {
          if (!processPricingData.itemId.additionalDetail.promotionDetails) {
            processPricingData.itemId.additionalDetail.promotionDetails =
              {} as any;
          }
          if (processPricingData?.planItemId?.[0]?.itemId) {
            processPricingData.itemId.additionalDetail.promotionDetails.title =
              processPricingData?.planItemId[0]?.itemId?.additionalDetail?.promotionDetails?.title;
            processPricingData.itemId.additionalDetail.promotionDetails.ctaName =
              processPricingData?.planItemId[0]?.itemId?.additionalDetail?.promotionDetails?.ctaName;
            processPricingData.itemId.additionalDetail.promotionDetails.planUserSave =
              processPricingData?.planItemId[0]?.itemId?.additionalDetail?.promotionDetails?.planUserSave;
            processPricingData.itemId.additionalDetail.promotionDetails.subtitle =
              processPricingData?.planItemId[0]?.itemId?.additionalDetail?.promotionDetails?.subtitle;
            processPricingData.itemId.additionalDetail.promotionDetails.paywallVisibility =
              processPricingData?.planItemId[0]?.itemId?.additionalDetail?.promotionDetails?.paywallVisibility;
            processPricingData.itemId.additionalDetail.promotionDetails.price =
              processPricingData?.planItemId[0]?.itemId?.price;
            processPricingData.itemId.additionalDetail.promotionDetails.itemName =
              processPricingData?.planItemId[0]?.itemId?.itemName;
          }
          processPricingData.itemId.additionalDetail.promotionDetails.mentorName =
            processPricingData?.profileData?.displayName;
          processPricingData.itemId.additionalDetail.promotionDetails.thumbnail =
            processPricingData?.itemId?.additionalDetail?.promotionDetails?.payWallThumbnail;
          if (processPricingData?.planItemId?.[0]?.itemId) {
            processPricingData.itemId.additionalDetail.promotionDetails.itemId =
              processPricingData?.planItemId[0]?.itemId._id;
            processPricingData.itemId.additionalDetail.promotionDetails.comparePrice =
              processPricingData?.planItemId[0]?.itemId.comparePrice;
            processPricingData.itemId.additionalDetail.promotionDetails.currency_code =
              processPricingData?.planItemId[0]?.itemId.currency?.currency_code;
            processPricingData.itemId.additionalDetail.promotionDetails.skipText =
              processPricingData?.itemId?.additionalDetail?.skipText;
          }

          const promoDetails =
            processPricingData.planItemId[0].itemId.additionalDetail
              .promotionDetails;

          // Pass both payWallVideo and payWallVideo1 if they exist
          if (promoDetails["payWallVideo"]) {
            processPricingData.itemId.additionalDetail.promotionDetails.payWallVideo =
              processPricingData?.itemId?.additionalDetail?.promotionDetails?.payWallVideo;
          }
          // if (promoDetails["payWallVideo1"]) {
          //   processPricingData.itemId.additionalDetail.promotionDetails.payWallVideo1 = promoDetails["payWallVideo1"];
          // }

          if (processPricingData?.planItemId?.[0]?.itemId) {
            processPricingData.itemId.additionalDetail.promotionDetails.bottomSheet =
              processPricingData?.planItemId[0]?.itemId.bottomSheet;
          }

          finalResponse.push(
            processPricingData.itemId.additionalDetail.promotionDetails
          );
        }

        const planItemIdStr =
          processPricingData?.planItemId?.[0]?.itemId?._id?.toString();
        const matchedItems: any[] = [];
        const nonMatchedItems: any[] = [];

        plandata.forEach((data) => {
          data.additionalDetail.promotionDetails.comparePrice =
            data.comparePrice;
          data.additionalDetail.promotionDetails.itemId = data._id;
          data.additionalDetail.promotionDetails.itemName = data.itemName;
          data.additionalDetail.promotionDetails.price = data.price;
          data.additionalDetail.promotionDetails.currency_code =
            data.currency?.currency_code;
          data.additionalDetail.promotionDetails.planId =
            data.additionalDetail?.planId;
          data.additionalDetail.promotionDetails.isNewSubscriber =
            subscriptionData ? false : true;
          data.additionalDetail.promotionDetails.planConfig =
            data.additionalDetail?.planConfig;
          data.additionalDetail.promotionDetails.mandates = mandateData?.mandate
            ?.mandates.length
            ? mandateData?.mandate?.mandates
            : [];
          data.additionalDetail.promotionDetails.bottomSheet =
            data.additionalDetail?.bottomSheet;

          // Check if this item matches the planItemId
          if (planItemIdStr && data._id?.toString() === planItemIdStr) {
            // Add skillName to matched items only
            data.additionalDetail.promotionDetails.skillName =
              processPricingData?.skill?.[0]
                ? processPricingData?.skill?.[0]?.skill_name
                : processPricingData?.skill?.skill_name;
            data.additionalDetail.promotionDetails.skipText =
              processPricingData?.itemId?.additionalDetail?.skipText;
            data.additionalDetail.promotionDetails.premiumThumbnails =
              processPricingData?.itemId?.additionalDetail?.promotionDetails?.premiumThumbnails;
            data.additionalDetail.promotionDetails.payWallVideo =
              processPricingData?.itemId?.additionalDetail?.promotionDetails?.payWallVideo;
            data.additionalDetail.promotionDetails.thumbnail =
              processPricingData?.itemId?.additionalDetail?.promotionDetails?.payWallThumbnail;
            matchedItems.push(data.additionalDetail.promotionDetails);
          } else {
            nonMatchedItems.push(data.additionalDetail.promotionDetails);
          }
        });
        finalResponse.push(...matchedItems);
        finalResponse.push(...nonMatchedItems);

        return finalResponse;
      }
    } catch (err) {
      console.error(
        "getPromotionDetailByItemId failed for itemId:",
        itemId,
        "Error:",
        err
      );
      throw err;
    }
  }

  private buildPlanPromotionDetail(
    planItem: any,
    context: {
      mentorName: string;
      skipText: string;
      skillName: string;
      isNewSubscription: boolean;
      itemPromoDetails: any;
      itemDescription: string;
    }
  ) {
    try{
    if (!planItem) {
      return null;
    }

    const {
      mentorName,
      skipText,
      skillName,
      isNewSubscription,
      itemPromoDetails,
      itemDescription,
    } = context;

    const additionalDetailPlain = planItem?.additionalDetail
      ? JSON.parse(JSON.stringify(planItem.additionalDetail))
      : {};
    const promoDetails = additionalDetailPlain?.promotionDetails || {};

    const premiumThumbnails = itemPromoDetails?.premiumThumbnails || [];

    const payWallVideo = itemPromoDetails?.payWallVideo || "";

    const planConfig = Array.isArray(additionalDetailPlain?.planConfig)
      ? additionalDetailPlain.planConfig
      : [];
    return {
      title: itemPromoDetails?.title || promoDetails?.title,
      planId:
        additionalDetailPlain?.planId ||
        planItem?.additionalDetail?.planId ||
        "",
      ctaName: promoDetails?.ctaName || planItem?.itemName,
      planUserSave: promoDetails?.planUserSave || "",
      subtitle: promoDetails?.subtitle || "",
      premiumThumbnails,
      payWallVideo,
      paywallVisibility:
        promoDetails?.paywallVisibility !== undefined
          ? promoDetails?.paywallVisibility
          : true,
      payWallThumbnail:
        itemPromoDetails?.payWallThumbnail ||
        promoDetails?.payWallThumbnail ||
        "",
      price: planItem?.price || 0,
      itemName: planItem?.itemName || "",
      itemDescription: itemDescription || "",
      mentorName: mentorName || "",
      thumbnail:
        itemPromoDetails?.payWallThumbnail ||
        promoDetails?.thumbnail ||
        "",
      itemId: planItem?._id?.toString() || "",
      comparePrice: planItem?.comparePrice || 0,
      currency_code: planItem?.currency?.currency_code || "",
      skipText: skipText || "",
      specialOffer: promoDetails?.specialOffer || "",
      premiumAdditional: promoDetails?.premiumAdditional || [],
      planDetails:
        promoDetails?.planDetails ||
        itemPromoDetails?.planDetails ||
        {},
      authDetail: promoDetails?.authDetail || {},
      subscriptionDetail: promoDetails?.subscriptionDetail || {},
      isNewSubscriber: isNewSubscription,
      planConfig,
      skillName: skillName || "",
      tags: promoDetails?.tags || [],
      subscriptionType: additionalDetailPlain?.subscriptiontype || "",
      yearlyPlanDetails:
        promoDetails?.yearlyPlanDetails || itemPromoDetails?.yearlyPlanDetails || {},
    };
  } catch(err){
    throw err
  }
  }

  private formatPromotionDetailsByType(
    plans: any[],
    type: EPayWallType
  ): any {
    try{
    if (!Array.isArray(plans) || plans.length === 0) {
      return { data: [] };
    }
    if (type === EPayWallType.subscription) {
      return {
        data: plans.map((plan) => ({
          planId: plan?.planId || "",
          planDetails:
            (plan?.subscriptionType || "").toLowerCase() === "yearly"
              ? plan?.yearlyPlanDetails || plan?.planDetails || {}
              : plan?.planDetails || {},
          authDetail: plan?.authDetail || {},
          subscriptionDetail: plan?.subscriptionDetail || {},
          planConfig: plan?.planConfig || [],
          itemId: plan?.itemId || "",
          itemName: plan?.itemName || "",
          itemDescription: plan?.itemDescription || "",
          tags: plan?.tags || [],
        })),
      };
    }

    if (type === EPayWallType.contest) {
      return {
        data: plans.map((plan) => ({
          itemId: plan?.itemId || "",
          itemName: plan?.itemName || "",
          planDetails: plan?.planDetails || {},
          planConfig: plan?.planConfig || [],
          authDetail: plan?.authDetail || {},
          subscriptionDetail: plan?.subscriptionDetail || {},
          premiumAdditional: plan?.premiumAdditional || [],
          itemDescription: plan?.itemDescription || "",
          tags: plan?.tags || [],
        })),
      };
    }

    const [
      firstPlan,
      ...remainingPlans
    ] = plans;

    const {
      planDetails: primaryPlanDetails = {},
      authDetail: primaryAuthDetail = {},
      subscriptionDetail: primarySubscriptionDetail = {},
      planConfig: primaryPlanConfig = [],
      tags: primaryTags = [],
      itemName: primaryItemName = "",
      itemId: primaryItemId = "",
      ...courseMeta
    } = firstPlan || {};

    const coursePlanSummaries = [
      {
        planDetails: primaryPlanDetails,
        authDetail: primaryAuthDetail,
        subscriptionDetail: primarySubscriptionDetail,
        planConfig: primaryPlanConfig,
        tags: primaryTags,
        itemName: primaryItemName,
        itemId: primaryItemId,
      },
      ...remainingPlans.map((plan) => ({
        planDetails: plan?.planDetails || {},
        authDetail: plan?.authDetail || {},
        subscriptionDetail: plan?.subscriptionDetail || {},
        planConfig: plan?.planConfig || [],
        tags: plan?.tags || [],
        itemName: plan?.itemName || "",
        itemId: plan?.itemId || "",
      })),
    ];

    return {
      ...courseMeta,
      data: coursePlanSummaries,
    };
  }catch(err){
    throw err
  }
  }

  private async getPromotionPage(phoneNumber?: string): Promise<string> {
   try{
    let type = await this.systemConfigurationModel.findOne({
      key: EPageTypeKey.paywallPageType
    })
    if (!phoneNumber || phoneNumber.length === 0 || phoneNumber.length < 10) {
      return type?.value?.type1;
    }
    const lastDigit = parseInt(phoneNumber.trim()[9], 10);
    if (isNaN(lastDigit)) {
      return type?.value?.type1;
    }

    if (lastDigit < 4) return type?.value?.type1;   
    if (lastDigit < 7) return type?.value?.type2;  
    return type?.value?.type3;   
   }catch(err){
    throw err
   }           
  }

  async getServiceItemDetailByProcessId(processId: string) {
    try {
      let data = await this.serviceItemModel.findOne({
        "additionalDetails.processId": new ObjectId(processId),
        status: Estatus.Active,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getItemDetailFromProcessId(processId: string) {
    try {
      let data = await this.serviceItemModel
        .findOne({
          "additionalDetails.processId": new ObjectId(processId),
          status: Estatus.Active,
        })
        .select("itemId")
        .lean();
      return { data };
    } catch (error) {
      throw error;
    }
  }
  async getRecommendationList(
    userId: string,
    itemId: string,
    type: ERecommendationListType
  ) {
    try {
      const metabaseResponse = await this.helperService.getItemIdFromMetaBase(
        userId,
        itemId,
        type
      );

      const itemPairs: [string, string][] = [];
      if (Array.isArray(metabaseResponse)) {
        for (let i = 0; i < metabaseResponse.length; i += 2) {
          if (metabaseResponse[i] && metabaseResponse[i + 1]) {
            itemPairs.push([
              String(metabaseResponse[i]),
              String(metabaseResponse[i + 1]),
            ]);
          }
        }
      }
      const itemIds = itemPairs.map(([itemId]) => new ObjectId(itemId));
      const pipeline = [
        {
          $match: {
            itemId: { $in: itemIds },
            type: { $in: ["course", "courses", "feedback"] },
            status: Estatus.Active,
          },
        },
        {
          $lookup: {
            from: "item",
            let: { serviceItemId: "$itemId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$serviceItemId"] } } },
              { $project: { itemName: 1 } },
            ],
            as: "itemDetails",
          },
        },
        {
          $lookup: {
            from: "profile",
            let: { expertUserId: "$userId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", "$$expertUserId"] },
                      { $eq: ["$type", "Expert"] },
                    ],
                  },
                },
              },
              { $project: { displayName: 1, language: 1, about: 1, tags: 1 } },
            ],
            as: "expertProfile",
          },
        },
        {
          $lookup: {
            from: "task",
            let: { taskProcessId: "$additionalDetails.processId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$processId", "$$taskProcessId"] },
                      { $eq: ["$taskNumber", 1] },
                    ],
                  },
                },
              },
              {
                $project: {
                  taskId: "$_id",
                  taskMedia: { $ifNull: ["$taskMetaData.media", []] },
                },
              },
            ],
            as: "taskDetails",
          },
        },
        {
          $project: {
            _id: 1,
            itemIdString: { $toString: "$itemId" },
            userId: 1,
            itemName: { $arrayElemAt: ["$itemDetails.itemName", 0] },
            expertName: { $arrayElemAt: ["$expertProfile.displayName", 0] },
            expertAbout: { $arrayElemAt: ["$expertProfile.about", 0] },
            expertLanguage: { $arrayElemAt: ["$expertProfile.language", 0] },
            expertTags: { $arrayElemAt: ["$expertProfile.tags", 0] },
            proficiency: { $ifNull: ["$proficiency", []] },
            category: { $ifNull: ["$category", []] },
            language: 1,
            processId: "$additionalDetails.processId",
            views: "$additionalDetails.views",
            media: { $ifNull: ["$additionalDetails.media", []] },
            taskId: { $arrayElemAt: ["$taskDetails.taskId", 0] },
            taskMedia: {
              $let: {
                vars: { firstTask: { $arrayElemAt: ["$taskDetails", 0] } },
                in: { $ifNull: ["$$firstTask.taskMedia", []] },
              },
            },
          },
        },
      ];

      const aggregatedRecommendationData =
        await this.serviceItemModel.aggregate(pipeline);
      const recommendationDataByItemId = new Map(
        aggregatedRecommendationData.map((recommendationItem) => [
          recommendationItem?.itemIdString,
          recommendationItem,
        ])
      );

      const formattedRecommendationList = itemPairs
        .map(([recommendationItemId, recommendationItemType]) => {
          const recommendationData =
            recommendationDataByItemId.get(recommendationItemId);
          const isCourseType =
            recommendationItemType === EType.courses ||
            recommendationItemType === EType.course;

          if (isCourseType) {
            return {
              type: EType.courses,
              itemName: recommendationData?.itemName,
              expertName: recommendationData?.expertName,
              badges: [
                ...recommendationData?.proficiency,
                ...recommendationData?.category,
              ],
              media: recommendationData?.taskMedia,
              views: recommendationData?.views,
              buttonText: EButtonText.watchNow,
              navigation: {
                page: ENavigation.courseShotVideo,
                type: ENavigation.internal,
                params: {
                  processId: recommendationData?.processId,
                  taskId: recommendationData?.taskId,
                },
              },
            };
          }

          if (recommendationItemType === EType.feedback) {
            return {
              type: EType.feedback,
              expertName: recommendationData?.expertName,
              about: recommendationData?.expertAbout,
              languages:
                recommendationData?.language ||
                recommendationData?.expertLanguage,
              badges: recommendationData?.expertTags,
              buttonText: EButtonText.getFeedback,
              media: recommendationData?.media,
              navigation: {
                page: ENavigation.expert,
                type: ENavigation.internal,
                params: {
                  expertId: recommendationData?._id,
                },
              },
            };
          }

          return null;
        })
        .filter(Boolean);

      return { data: formattedRecommendationList };
    } catch (error) {
      throw error;
    }
  }
  async defaultRecommendationItemId(
    userId: string,
    itemId: string,
    type: string
  ) {
    try {
      const serviceItemType =
        type === EType.course ? EType.courses : EserviceItemType.contest;

      const currentServiceItem = await this.serviceItemModel
        .findOne({
          status: EStatus.Active,
          itemId: new ObjectId(itemId),
          type: serviceItemType,
        })
        .select("skill.skillId")
        .lean();

      const isCourse = type === EType.course;
      const skill = currentServiceItem?.skill;
      const skillId =
        Array.isArray(skill) && skill[0]
          ? skill[0]?.skillId
          : (skill as any)?.skillId;
      if (!skillId) return [];

      const relatedServiceItems = await this.serviceItemModel
        .find({
          status: EStatus.Active,
          type: "courses",
          "skill.skillId": skillId,
          itemId: { $ne: new ObjectId(itemId) },
        })
        .sort({ priorityOrder: 1 })
        .select("itemId additionalDetails.processId")
        .lean();

      const watchedProcessIds = isCourse
        ? new Set(
            (await this.processService.getUserProcessDetails(userId))
              .map((p) => p.processId?.toString())
              .filter(Boolean)
          )
        : new Set<string>();

      const recommendationItems: string[] = [];
      for (const serviceItem of relatedServiceItems) {
        if (recommendationItems.length >= 6) break;
        const itemIdString = serviceItem.itemId?.toString();
        if (!itemIdString) continue;

        if (isCourse) {
          const processId =
            serviceItem.additionalDetails?.processId?.toString();
          if (processId && !watchedProcessIds.has(processId)) {
            recommendationItems.push(itemIdString, EType.course);
          }
        } else {
          recommendationItems.push(itemIdString, EType.course);
        }
      }
      return recommendationItems;
    } catch (error) {
      throw error;
    }
  }
}

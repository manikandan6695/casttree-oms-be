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
import { EServiceRequestStatus } from "src/service-request/enum/service-request.enum";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { ISystemConfigurationModel } from "src/shared/schema/system-configuration.schema";
import { SubscriptionService } from "src/subscription/subscription.service";
import { FilterItemRequestDTO } from "./dto/filter-item.dto";
import { EcomponentType, Eheader } from "./enum/courses.enum";
import { EprofileType } from "./enum/profileType.enum";
import { Eitem } from "./enum/rating_sourcetype_enum";
import {
  EServiceItemTag,
  EserviceItemType,
  ESkillId,
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

@Injectable()
export class ServiceItemService {
  constructor(
    @InjectModel("serviceitems") private serviceItemModel: Model<serviceitems>,
    @InjectModel("priceListItems")
    private priceListItemModel: Model<IPriceListItemsModel>,
    @InjectModel("systemConfiguration")
    private systemConfigurationModel: Model<ISystemConfigurationModel>,
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
      console.log("query", query);
      const filter = {};
      if (query.languageId) {
        if (typeof query.languageId === "string") {
          filter["language.languageId"] = query.languageId;
        } else {
          filter["language.languageId"] = { $in: query.languageId };
        }
      }
      const skillId = query.skillId || ESkillId.skillId;
      if (typeof skillId === "string") {
        filter["skill.skillId"] = skillId;
      } else {
        filter["skill.skillId"] = { $in: skillId };
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
        let processPrice =
          itemListObjectWithUpdatedPrice[processPricingData.itemId._id];
        if (processPrice) {
          processPricingData.itemId["price"] = processPrice["price"];
          processPricingData.itemId["comparePrice"] =
            processPrice["comparePrice"];
          processPricingData.itemId["currency"] = processPrice["currency"];
        }
      }
      // console.log("processPricingData",processPricingData?.itemId);

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
      promoDetails.payWallVideo =
        isNewSubscription === true
          ? promoDetails["payWallVideo"]
          : promoDetails["payWallVideo1"];
      delete promoDetails["payWallVideo1"];
      processPricingData.itemId.additionalDetail.promotionDetails.bottomSheet =
        processPricingData.itemId.bottomSheet;
      finalResponse.push(
        processPricingData.itemId.additionalDetail.promotionDetails
      );
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
    } catch (err) {}
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
  async getPromotionDetailsV2() {
    try {
      let itemData = await this.itemService.getItemByItemName(EItemName.pro);
      let provider = await this.systemConfigurationModel.findOne({
        key: ESystemConfigurationKeyName.subscription_payment_provider,
      });
      let finalResponse = {
        payWallVideo:
          itemData?.additionalDetail?.promotionDetails?.payWallVideo,
        authInfo: itemData?.additionalDetail?.promotionDetails?.authDetail,
        subscriptionInfo:
          itemData?.additionalDetail?.promotionDetails?.subscriptionDetail,
        premiumThumbnails:
          itemData?.additionalDetail?.promotionDetails?.premiumThumbnails,
        provider: provider?.value?.provider,
        provideId: provider?.value?.providerId,
        itemId: itemData?._id,
        itemName: itemData?.itemName,
        price: itemData?.price,
        currency_code: itemData?.currency?.currency_code,
        comparePrice: itemData?.comparePrice,
      };
      return { data: finalResponse };
    } catch (error) {
      throw error;
    }
  }
  async getContestDetailBySkillId() {
    try {
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
          $sort: {
            skillName: 1,
          },
        },
        {
          $project: {
            _id: 0,
            skillId: 1,
            skillName: 1,
            mediaUrl: 1,
          },
        },
      ]);

      return { data: skills };
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
}

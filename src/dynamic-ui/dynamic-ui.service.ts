import { SubscriptionService } from "src/subscription/subscription.service";
import { EStatus } from "./../process/enums/process.enum";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IAppNavBar } from "./schema/app-navbar.entity";
import { IComponent } from "./schema/component.entity";
import { IContentPage } from "./schema/page-content.entity";
import { serviceitems } from "src/item/schema/serviceItem.schema";
import { EserviceItemType } from "src/item/enum/serviceItem.type.enum";
import { Estatus } from "src/item/enum/status.enum";
import { ProcessService } from "src/process/process.service";
import { EprofileType } from "src/item/enum/profileType.enum";
import { HelperService } from "src/helper/helper.service";
import { EsubscriptionStatus } from "src/subscription/enums/subscriptionStatus.enum";
import { ISystemConfigurationModel } from "src/shared/schema/system-configuration.schema";
import { EComponentType } from "./enum/component.enum";
import { EMixedPanelEvents } from "src/helper/enums/mixedPanel.enums";
import { ENavBar } from "./enum/nav-bar.enum";
const { ObjectId } = require("mongodb");
@Injectable()
export class DynamicUiService {
  constructor(
    @InjectModel("appNavBar")
    private readonly appNavBarModel: Model<IAppNavBar>,
    @InjectModel("component")
    private readonly componentModel: Model<IComponent>,
    @InjectModel("serviceitems")
    private serviceItemModel: Model<serviceitems>,
    @InjectModel("systemConfiguration")
    private systemConfigurationModel: Model<ISystemConfigurationModel>,
    @InjectModel("contentPage")
    private readonly contentPageModel: Model<IContentPage>,
    private processService: ProcessService,
    private helperService: HelperService,
    private subscriptionService: SubscriptionService
  ) {}
  async getNavBarDetails(token: any, key: string) {
    try {
      let data = await this.appNavBarModel
        .findOne({
          key: key,
          status: EStatus.Active,
        })
        .lean();
      // console.log("app nav bar", JSON.stringify(data));
      let tabs = await this.matchRoleByUser(token, data.tabs);
      // console.log("tabs ===>", JSON.stringify(tabs));
      data["tabs"] = tabs;
      if (key == ENavBar.learnHomeHeader) {
        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.learn_homepage_success;
        mixPanelBody.distinctId = token.id;
        mixPanelBody.properties = {};
        await this.helperService.mixPanel(mixPanelBody);
      }
      return { data };
    } catch (err) {
      throw err;
    }
  }

  async matchRoleByUser(token, tabs) {
    try {
      const profileArr = await this.helperService.getProfileByIdTl([token.id]);
      const profile = Array.isArray(profileArr) ? profileArr[0] : profileArr;
      const userRoleIds = (profile?.roles || []).map(
        (role) => new ObjectId(role._id)
      );

      if (!userRoleIds.length || !Array.isArray(tabs)) return tabs;

      const matchingTabs = [];
      const nonMatchingTabs = [];
      const userRoleIdSet = new Set(userRoleIds.map((id) => id.toString()));
      for (const tab of tabs) {
        console.log("role id is", tab.roleId);
        if (userRoleIdSet.has(tab.roleId.toString())) {
          matchingTabs.push(tab);
        } else {
          nonMatchingTabs.push(tab);
        }
      }

      return [...matchingTabs, ...nonMatchingTabs];
    } catch (err) {
      throw err;
    }
  }

  async getPageDetails(token: UserToken, pageId: string, category: string, proficiency: string) {
    try {
      const [subscriptionData, existingUserSubscription] = await Promise.all([
        this.subscriptionService.validateSubscription(token.id, [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.failed,
          EsubscriptionStatus.expired,
        ]),
        this.subscriptionService.validateSubscription(token.id, [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.failed,
        ]),
      ]);
      const isNewSubscription = !!subscriptionData;
      const isSubscriber = !!existingUserSubscription;
      // console.log("subscriber", isNewSubscription, isSubscriber);

      const { data: { country_code: countryCode } = {} } =
        await this.helperService.getUserById(token.id);
      let country_code = countryCode;

      let data = await this.contentPageModel
        .findOne({
          _id: pageId,
          status: EStatus.Active,
        })
        .lean();
      //   console.log("data", data);
      let componentIds = data.components.map((e) => e.componentId);
      let componentDocs = await this.componentModel
        .find({
          _id: { $in: componentIds },
          status: EStatus.Active,
        })
        .populate("interactionData.items.banner")
        .lean();
      let serviceItemData = await this.fetchServiceItemDetails(
        data,
        token.id,
        false,
        0,
        0,
        category,
        proficiency
      );

      const processIds = [];

      const serviceItem = serviceItemData.finalData;
      for (const category in serviceItem) {
        if (Array.isArray(serviceItem[category])) {
          serviceItem[category].forEach((item) => {
            if (item.processId) {
              processIds.push(item.processId);
            }
          });
        }
      }

      let unquieProcessIds = [...new Set(processIds)];

      let continueWatching = await this.fetchContinueWatching(
        token.id,
        unquieProcessIds
      );
      let singleAdBanner = await this.fetchSingleAdBanner(
        isNewSubscription,
        token.id,
        isSubscriber
      );
      let banners = await this.fetchUserPreferenceBanner(
        isNewSubscription,
        token.id,
        continueWatching,
        componentDocs,
        country_code,
        isSubscriber
      );
      componentDocs.forEach((comp) => {
        if (comp.type == "userPreference") {
          comp.actionData = continueWatching?.actionData;
        }
        if (comp.type == EComponentType.userPreferenceBanner) {
          comp.media = singleAdBanner?.media;
          comp.banner = {
            ...comp.banner,
            bannerImage: singleAdBanner?.media?.mediaUrl,
          };
          comp.navigation = {
            ...singleAdBanner?.navigation,
            type: comp?.navigation?.type,
          };
        }
        if (comp.type == EComponentType.userPreferenceBanner) {
          comp.interactionData = { items: banners };
        }
        const tagName = comp?.tag?.tagName;
        if (tagName && serviceItemData?.finalData?.[tagName]) {
          comp.actionData = serviceItemData.finalData[tagName];
          comp["isViewAll"] =
            serviceItemData.finalData[tagName].length > 10 ? true : false;
        }
      });
      componentDocs.sort((a, b) => a.order - b.order);
      data["components"] = componentDocs;
      return { data };
    } catch (err) {
      throw err;
    }
  }

  async getComponent(
    token: UserToken,
    componentId: string,
    skip: number,
    limit: number
  ) {
    try {
      let component = await this.componentModel
        .findOne({
          _id: componentId,
          status: EStatus.Active,
        })
        .lean();
      let page = await this.contentPageModel
        .findOne({ "components.componentId": componentId })
        .lean();
      let serviceItemData = await this.fetchServiceItemDetails(
        page,
        token.id,
        true,
        skip,
        limit,
        null,
        null
      );

      const tagName = component?.tag?.tagName;
      if (tagName && serviceItemData?.finalData?.[tagName]) {
        component.actionData = serviceItemData.finalData[tagName];
        component["totalCount"] = serviceItemData?.count;
      }
      return { component };
    } catch (err) {
      throw err;
    }
  }

  async fetchServiceItemDetails(
    data,
    userId: string,
    isPagination = false,
    skip,
    limit,
    category,
    proficiency: string
  ) {
    try {
      let filter: any = {
        type: EserviceItemType.courses,
        "skill.skillId": { $in: [new ObjectId(data.metaData?.skillId)] },
        status: Estatus.Active,
      };
      if (proficiency) {
        filter["proficiency.category_id"] = new ObjectId(proficiency);
      }

      if (category) {
        let categoryArr: string[];

        if (Array.isArray(category)) {
          categoryArr = category;
        } else {
          try {
            const parsed = JSON.parse(category);
            categoryArr = Array.isArray(parsed) ? parsed : String(category).split(",");
          } catch {
            categoryArr = String(category).split(",");
          }
        }

        if (categoryArr.length) {
          filter["category.category_id"] = {
            $in: categoryArr.map(id => new ObjectId(id)),
          };
        }
      }
      let aggregationPipeline = [];
      aggregationPipeline.push({
        $match: filter,
      });
      let countPipe = [...aggregationPipeline];
      if (isPagination) {
        aggregationPipeline.push({
          $sort: { _id: -1 },
        });
        aggregationPipeline.push({ $skip: skip });
        aggregationPipeline.push({ $limit: limit });
      } else {
        aggregationPipeline.push({
          $sort: { _id: -1 },
        });
      }
      countPipe.push({
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      });
      aggregationPipeline.push(
        {
          $addFields: {
            tagPairs: {
              $zip: {
                inputs: [
                  {
                    $cond: [
                      { $isArray: "$tag.name" },
                      "$tag.name",
                      ["$tag.name"],
                    ],
                  },
                  {
                    $cond: [
                      { $isArray: "$tag.order" },
                      "$tag.order",
                      ["$tag.order"],
                    ],
                  },
                ],
              },
            },
          },
        },
        {
          $unwind: "$tagPairs",
        },
        {
          $addFields: {
            tagName: { $arrayElemAt: ["$tagPairs", 0] },
            tagOrder: { $arrayElemAt: ["$tagPairs", 1] },
          },
        },
        {
          $group: {
            _id: {
              tagName: "$tagName",
              processId: "$additionalDetails.processId",
            },
            detail: {
              $first: {
                $mergeObjects: [
                  "$additionalDetails",
                  { tagOrder: "$tagOrder", tagName: "$tagName" },
                ],
              },
            },
            priorityOrder: { $first: "$priorityOrder" },
          },
        },
        {
          $sort: { priorityOrder: 1, "_id.processId": -1 },
        },
        {
          $group: {
            _id: "$_id.tagName",
            details: { $push: "$detail" },
          },
        },
        {
          $addFields: {
            details: {
              $sortArray: {
                input: "$details",
                sortBy: { tagOrder: 1 },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            tagName: "$_id",
            details: 1,
          },
        }
      );

      // console.log("aggregationPipeline", JSON.stringify(aggregationPipeline));

      const serviceItemData =
        await this.serviceItemModel.aggregate(aggregationPipeline);
      // console.log("serviceItemData", JSON.stringify(serviceItemData));

      let totalCount = await this.serviceItemModel.aggregate(countPipe);
      // console.log("totalCount", totalCount);
      let count;
      if (totalCount.length) {
        count = totalCount[0].count;
      }

      //   const serviceItemData = await this.serviceItemModel.aggregate([
      //     {
      //       $match: filter,
      //     },
      //     {
      //       $addFields: {
      //         tagNames: {
      //           $cond: {
      //             if: { $isArray: "$tag.name" },
      //             then: "$tag.name",
      //             else: ["$tag.name"],
      //           },
      //         },
      //       },
      //     },
      //     {
      //       $unwind: "$tagNames",
      //     },
      //     {
      //       $group: {
      //         _id: {
      //           tagName: "$tagNames",
      //           processId: "$additionalDetails.processId",
      //         },
      //         detail: { $first: "$additionalDetails" },
      //         priorityOrder: { $first: "$priorityOrder" },
      //         tagOrder: { $first: "$tag.order" },
      //       },
      //     },
      //     {
      //       $sort: { priorityOrder: 1, _id: -1 },
      //     },
      //     {
      //       $group: {
      //         _id: {
      //           tagName: "$_id.tagName",
      //           tagOrder: "$tagOrder",
      //         },
      //         details: { $push: "$detail" },
      //       },
      //     },
      //     {
      //       $sort: { "_id.tagOrder": 1 },
      //     },
      //     {
      //       $project: {
      //         _id: 0,
      //         tagName: "$_id.tagName",
      //         details: 1,
      //       },
      //     },
      //   ]);
      //   const serviceItemData = await this.serviceItemModel.aggregate([
      //     {
      //       $match: filter,
      //     },
      //     {
      //       $addFields: {
      //         tagNames: {
      //           $cond: {
      //             if: { $isArray: "$tag.name" },
      //             then: "$tag.name",
      //             else: ["$tag.name"],
      //           },
      //         },
      //       },
      //     },
      //     {
      //       $unwind: "$tagNames",
      //     },
      //     {
      //       $group: {
      //         _id: {
      //           tagName: "$tagNames",
      //           tagOrder: "$tag.order",
      //         },
      //         details: {
      //           $push: {
      //             $mergeObjects: [
      //               "$additionalDetails",
      //               {
      //                 priorityOrder: "$priorityOrder",
      //                 processId: "$additionalDetails.processId",
      //               },
      //             ],
      //           },
      //         },
      //       },
      //     },
      //     {
      //       $addFields: {
      //         details: {
      //           $sortArray: {
      //             input: "$details",
      //             sortBy: { priorityOrder: 1, processId: -1 },
      //           },
      //         },
      //       },
      //     },
      //     {
      //       $project: {
      //         _id: 0,
      //         tagName: "$_id.tagName",
      //         details: 1,
      //       },
      //     },
      //     {
      //       $sort: {
      //         "_id.tagOrder": 1,
      //       },
      //     },
      //   ]);
      //   console.log("service item data", JSON.stringify(serviceItemData));

      const processIds = serviceItemData.flatMap((item) =>
        item.details.map((detail) => detail.processId)
      );
      let firstTasks = await this.processService.getFirstTask(
        processIds,
        userId
      );
      const taskMap = new Map(
        firstTasks.map((task) => [task.processId.toString(), task])
      );
      //   console.log("taskMap", taskMap);

      serviceItemData.forEach((item) => {
        item.details = item.details.map((detail) => {
          const matchingTask = taskMap.get(detail.processId.toString());
          return {
            ...detail,
            taskDetail: matchingTask || null,
          };
        });
      });
      const finalData = serviceItemData.reduce((a, c) => {
        a[c.tagName] = c.details;
        return a;
      }, {});
      return { finalData, count };
    } catch (err) {
      throw err;
    }
  }
  async fetchContinueWatching(userId: string, processIds: string[]) {
    try {
      let pendingProcessInstanceData =
        await this.processService.allPendingProcess(userId, processIds);
      //   console.log("pendingProcessInstanceData", pendingProcessInstanceData);

      let continueWatching = {
        actionData: [],
      };
      if (pendingProcessInstanceData.length > 0) {
        let continueProcessIds = [];
        pendingProcessInstanceData.map((data) =>
          continueProcessIds.push(data?.processId)
        );
        let mentorUserIds = await this.getMentorUserIds(continueProcessIds);

        for (let i = 0; i < pendingProcessInstanceData.length; i++) {
          continueWatching["actionData"].push({
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

      return continueWatching;
    } catch (err) {
      throw err;
    }
  }

  // async fetchUserPreferenceBanner(
  //   isNewSubscription: boolean,
  //   userId: string,
  //   userProcessedSeries,
  //   components,
  //   country_code: string,
  //   isSubscriber: boolean
  // ) {
  //   try {
  //     const data = components.find(
  //       (e) => e.type === EComponentType.personalizedBanner
  //     );
  //     if (!data?.interactionData?.items?.length) return [];

  //     const isLocked =
  //       userProcessedSeries?.actionData?.[0]?.taskDetail?.isLocked;
  //     console.log("userProcessedSeries", JSON.stringify(userProcessedSeries));

  //     let bestMatch: any = null;
  //     let referralBanner: any = null;
  //     console.log("items", JSON.stringify(data.interactionData.items));

  //     for (const item of data.interactionData.items) {
  //       const rule = item.rule || {};
  //       const isSubscribedRule = rule.isSubscribed;
  //       const isNewSubscribedRule = rule.isNewSubscriber;
  //       const ruleCountry = rule.country;
  //       const ruleIsLocked = rule.isLocked;

  //       const bannerData = {
  //         banner: item?.banner?.banner,
  //         navigation: item?.banner?.navigation,
  //       };

  //       const isLockedMatch =
  //         typeof ruleIsLocked === "boolean" && ruleIsLocked === isLocked;
  //       console.log(
  //         "subscription",
  //         isNewSubscribedRule,
  //         isSubscriber,
  //         isLockedMatch
  //       );

  //       if (isNewSubscribedRule === isSubscriber && isLockedMatch) {
  //         return [bannerData];
  //       }

  //       const isCountryMatch =
  //         typeof ruleCountry === "object" && "$ne" in ruleCountry
  //           ? country_code !== ruleCountry["$ne"]
  //           : country_code === ruleCountry;

  //       if (
  //         isSubscribedRule === isNewSubscription &&
  //         isCountryMatch &&
  //         !bestMatch
  //       ) {
  //         bestMatch = bannerData;
  //       }
  //       if (isSubscribedRule === true && !referralBanner) {
  //         referralBanner = bannerData;
  //       }
  //     }

  //     if (bestMatch) return [bestMatch];
  //     if (referralBanner) return [referralBanner];

  //     return [];
  //   } catch (err) {
  //     console.error("Error in fetchUserPreferenceBanner:", err);
  //     throw err;
  //   }
  // }
  async fetchUserPreferenceBanner(
    isNewSubscription: boolean,
    userId: string,
    userProcessedSeries,
    components,
    countryCode: string,
    isSubscriber: boolean
  ) {
    try {
      // console.log("isNewSubscription", isNewSubscription);
      // console.log("isSubscriber", isSubscriber);

      const personalizedBannerComponent = components.find(
        (c) => c.type === EComponentType.userPreferenceBanner
      );

      if (!personalizedBannerComponent?.interactionData?.items?.length) {
        return [];
      }

      const isFirstSeriesLocked = userProcessedSeries?.actionData.some(
        (action) => action.taskDetail?.isLocked === true
      );
      // console.log("isSubscriber", isSubscriber);

      let bestMatchBanner: any = null;
      let referralBanner: any = null;
      for (const item of personalizedBannerComponent.interactionData.items) {
        const rule = item.rule || {};
        const bannerData = {
          banner: item?.banner?.banner,
          navigation: item?.banner?.navigation,
        };
        let isNewSubscriberRule = rule.isNewSubscriber;
        // console.log("isNewSubscriberRule", isNewSubscriberRule,item.type);

        let isSubscribedRule = rule.isSubscribed;

        // console.log("isSubscribedRule", isSubscribedRule,item.type);

        const matchesCountry =
          typeof rule.country === "object" && "$ne" in rule.country
            ? countryCode !== rule.country["$ne"]
            : countryCode === rule.country;

        if (
          isSubscriber == isNewSubscriberRule &&
          countryCode == rule.country &&
          isFirstSeriesLocked == rule.isLocked &&
          item.type == "newPayment"
        ) {
          return [bannerData];
        }

        if (
          rule.isSubscribed == isNewSubscriberRule &&
          countryCode == rule.country &&
          isFirstSeriesLocked == rule.isLocked &&
          item.type == "payment"
        ) {
          return [bannerData];
        }
        if (
          isSubscriber == isSubscribedRule &&
          isFirstSeriesLocked == false &&
          item.type == "course"
        ) {
          return [bannerData];
        }
        if (
          (rule.isSubscribed == isSubscriber &&
            matchesCountry &&
            isFirstSeriesLocked &&
            item.type == "IAPPayment") ||
          (matchesCountry &&
            rule.isSubscribed == isNewSubscription &&
            item.type == "IAPPayment")
        ) {
          return [bannerData];
        }
        if (rule.isSubscribed === isNewSubscription && !referralBanner) {
          // console.log("inside referral");
          referralBanner = bannerData;
        }
      }

      if (bestMatchBanner) return [bestMatchBanner];
      if (referralBanner) return [referralBanner];

      return [];
    } catch (err) {
      console.error("Error in fetchUserPreferenceBanner:", err);
      throw err;
    }
  }

  async evaluateCountryRule(ruleCountry, userCountry) {
    try {
      if (!ruleCountry) return true;

      if (
        typeof ruleCountry === "object" &&
        "$ne" in ruleCountry &&
        ruleCountry !== undefined
      ) {
        return userCountry !== ruleCountry["$ne"];
      }

      return ruleCountry === userCountry;
    } catch (err) {
      throw err;
    }
  }

  async fetchSingleAdBanner(
    isNewSubscription: boolean,
    userId: string,
    isSubscriber: boolean
  ) {
    try {
      const { data: { country_code: countryCode } = {} } =
        await this.helperService.getUserById(userId);

      const referralConfig = await this.systemConfigurationModel.findOne({
        key: "referral_banners",
      });
      if (!referralConfig || !Array.isArray(referralConfig.value)) return;

      const getScreenName = (bannerObj) =>
        countryCode === "IN" ? bannerObj?.screenName : bannerObj?.iapScreenName;

      const bannerMap = Object.fromEntries(
        referralConfig.value.map((b) => [b.banner, b])
      );

      const learnBanner = bannerMap["learnhomepage"];
      const premiumBannerObj = bannerMap["buypremium"];
      let premiumBanner =
        countryCode === "IN"
          ? isSubscriber === false
            ? premiumBannerObj?.imageUrl
            : premiumBannerObj?.imageUrlUpdated
          : premiumBannerObj?.iapImageUrl;
      if (!learnBanner || !premiumBannerObj) return;
      const banner = isNewSubscription
        ? {
            media: { mediaUrl: learnBanner.imageUrl },
            navigation: {
              page: getScreenName(learnBanner),
              type: "internal",
              ...(getScreenName(learnBanner) !== "ReferralScreen" && {
                params: {
                  processId: learnBanner.processId,
                  taskId: learnBanner.taskId,
                },
              }),
            },
          }
        : {
            media: { mediaUrl: premiumBanner },
            navigation: {
              page: getScreenName(premiumBannerObj),
              type: "internal",
              params: {
                processId: premiumBannerObj.processId,
                taskId: premiumBannerObj.taskId,
              },
            },
          };

      return banner;
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
}

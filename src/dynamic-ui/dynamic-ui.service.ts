import { SubscriptionService } from "src/subscription/subscription.service";
import { EStatus } from "./../process/enums/process.enum";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
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
import { EComponentKey, EComponentType, EItemType } from "./enum/component.enum";
import { EMixedPanelEvents } from "src/helper/enums/mixedPanel.enums";
import { log } from "console";
import { ENavBar } from "./enum/nav-bar.enum";
import { IUserFilterPreference } from "./schema/user-filter-preference.schema";
import { IFilterType } from "./schema/filter-type.schema";
import { IFilterOption } from "./schema/filter-option.schema";
import { EFilterOption } from "./dto/filter-option.dto";

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
    @InjectModel("userFilterPreferences")
    private readonly userFilterPreferenceModel: Model<IUserFilterPreference>,
    @InjectModel("filterTypes")
    private readonly filterTypeModel: Model<IFilterType>,
    @InjectModel("filterOptions")
    private readonly filterOptionsModel: Model<IFilterOption>,
    private processService: ProcessService,
    private helperService: HelperService,
    private subscriptionService: SubscriptionService
  ) { }
  async getNavBarDetails(token: any, key: string) {
    try {
      let data = await this.appNavBarModel
        .findOne({
          key: key,
          status: "Active",
        })
        .lean();
      let tabs = await this.matchRoleByUser(token, data.tabs);
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

  async getPageDetails(token: UserToken, pageId: string, filterOption: EFilterOption) {
    try {
      // const subscriptionData =
      //   await this.subscriptionService.validateSubscription(token.id, [
      //     EsubscriptionStatus.initiated,
      //     EsubscriptionStatus.failed,
      //     EsubscriptionStatus.expired,
      //   ]);
      // const existingUserSubscription =
      //   await this.subscriptionService.validateSubscription(token.id, [
      //     EsubscriptionStatus.initiated,
      //     EsubscriptionStatus.failed,
      //   ]);
      // const isNewSubscription = subscriptionData ? true : false;
      // const isSubscriber = existingUserSubscription ? true : false;
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
      console.log("subscriber", isNewSubscription, isSubscriber);

      const { data: { country_code: countryCode } = {} } =
        await this.helperService.getUserById(token.id);
      let country_code = countryCode;

      let data = await this.contentPageModel
        .findOne({
          _id: pageId,
          status: EStatus.Active,
        })
        .lean();
        // console.log("data", data);
      let componentIds = data.components.map((e) => e.componentId);
      let componentDocs = await this.componentModel
        .find({
          _id: { $in: componentIds },
          status: EStatus.Active,
        })
        .sort({ order: 1 })
        .populate("interactionData.items.banner")
        .lean();
      // console.log("componentDocs", componentDocs);
      let serviceItemData = await this.fetchServiceItemDetails(
        data,
        token.id,
        false,
        0,
        0,
        null
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
      
      const componentsWithInteractionData = componentDocs.filter(comp => comp.interactionData);
      if (componentsWithInteractionData.length > 0) {
        let availableFilterOptions = await this.componentFilterOptions();

        const grouped = availableFilterOptions.reduce((acc, opt) => {
          if (!acc[opt.filterType]) {
            acc[opt.filterType] = {
              type: opt.filterType,
              filterTypeId: opt.filterTypeId.toString(),
              options: [],
            };
          }
          acc[opt.filterType].options.push({
            filterOptionId: opt._id.toString(),
            filterType: opt.filterType,
            optionKey: opt.optionKey,
            optionValue: opt.optionValue,
          });
          return acc;
        }, {});

        componentsWithInteractionData.forEach(component => {
          if (component.componentKey === EComponentKey.learnFilterActionButton) {
            component.interactionData = { items: Object.values(grouped) };
          }
        });
      }
      return { data };
    } catch (err) {
      throw err;
    }
  }
  async getComponent(
    token: UserToken,
    componentId: string,
    skip: number,
    limit: number,
    filterOption: EFilterOption
  ) {
    try {
      let component = await this.componentModel
        .findOne({ _id: componentId, status: EStatus.Active })
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
        filterOption
      );
      const tagName = component?.tag?.tagName;
      let allData: any[] = [];
      if (tagName && serviceItemData?.finalData?.[tagName]) {
        allData = serviceItemData.finalData[tagName];
        component.actionData = allData;
        component["totalCount"] = serviceItemData?.count || 0;
      } else {
        allData = Object.values(serviceItemData.finalData || {}).flat();
        const uniqueData = allData.filter((item, index, self) => {
          if (!item.taskDetail || !item.taskDetail._id) return true;
          return (
            index ===
            self.findIndex(
              i => i.taskDetail?._id?.toString() === item.taskDetail._id.toString()
            )
          );
        });
        component.actionData = uniqueData;
        component["totalCount"] = serviceItemData?.count || 0;
      }

      if (component?.interactionData) {
        let availableFilterOptions = await this.componentFilterOptions();

        const grouped = availableFilterOptions.reduce((acc, opt) => {
          if (!acc[opt.filterType]) {
            acc[opt.filterType] = {
              type: opt.filterType,
              filterTypeId: opt.filterTypeId.toString(),
              options: [],
            };
          }
          acc[opt.filterType].options.push({
            filterOptionId: opt._id.toString(),
            filterType: opt.filterType,
            optionKey: opt.optionKey,
            optionValue: opt.optionValue,
            isUserSelected: false,
          });
          return acc;
        }, {});

        if (filterOption?.proficiency) {
          grouped[EItemType.proficiency]?.options.forEach(opt => {
            opt.isUserSelected = opt.filterOptionId === filterOption.proficiency;
          });
        }

        if (filterOption?.category && filterOption.category.length > 0) {
          grouped[EItemType.category]?.options.forEach(opt => {
            opt.isUserSelected = filterOption.category.includes(opt.filterOptionId);
          });
        }

       if (component.componentKey === EComponentKey.learnFilterActionButton) {
        component.interactionData = { items: Object.values(grouped) };
       }
      }

      return { component };
    } catch (err) {
      throw err;
    }
  }
  // async fetchServiceItemDetails(
  //   data,
  //   userId: string,
  //   isPagination = false,
  //   skip,
  //   limit
  // ) {
  //   try {
  //     let filter = {
  //       type: EserviceItemType.courses,
  //       "skill.skillId": { $in: [new ObjectId(data.metaData?.skillId)] },
  //       status: Estatus.Active,
  //     };
  //     let aggregationPipeline = [];
  //     aggregationPipeline.push({
  //       $match: filter,
  //     });
  //     let countPipe = [...aggregationPipeline];
  //     if (isPagination) {
  //       aggregationPipeline.push({
  //         $sort: { _id: -1 },
  //       });
  //       aggregationPipeline.push({ $skip: skip });
  //       aggregationPipeline.push({ $limit: limit });
  //     } else {
  //       aggregationPipeline.push({
  //         $sort: { _id: -1 },
  //       });
  //     }
  //     countPipe.push({
  //       $group: {
  //         _id: null,
  //         count: { $sum: 1 },
  //       },
  //     });
  //     aggregationPipeline.push(
  //       {
  //         $addFields: {
  //           tagNames: {
  //             $cond: {
  //               if: { $isArray: "$tag.name" },
  //               then: "$tag.name",
  //               else: ["$tag.name"],
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $unwind: "$tagNames",
  //       },
  //       {
  //         $group: {
  //           _id: {
  //             tagName: "$tagNames",
  //             processId: "$additionalDetails.processId",
  //           },
  //           detail: { $first: "$additionalDetails" },
  //           priorityOrder: { $first: "$priorityOrder" },
  //         },
  //       },
  //       {
  //         $sort: { priorityOrder: 1, _id: -1 },
  //       },
  //       {
  //         $group: {
  //           _id: "$_id.tagName",
  //           details: { $push: "$detail" },
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           tagName: "$_id",
  //           details: 1,
  //         },
  //       }
  //     );

  //     // console.log("aggregationPipeline", aggregationPipeline);

  //     const serviceItemData =
  //       await this.serviceItemModel.aggregate(aggregationPipeline);
  //     let totalCount = await this.serviceItemModel.aggregate(countPipe);
  //     // console.log("totalCount", totalCount);
  //     let count;
  //     if (totalCount.length) {
  //       count = totalCount[0].count;
  //     }

  //     //   const serviceItemData = await this.serviceItemModel.aggregate([
  //     //     {
  //     //       $match: filter,
  //     //     },
  //     //     {
  //     //       $addFields: {
  //     //         tagNames: {
  //     //           $cond: {
  //     //             if: { $isArray: "$tag.name" },
  //     //             then: "$tag.name",
  //     //             else: ["$tag.name"],
  //     //           },
  //     //         },
  //     //       },
  //     //     },
  //     //     {
  //     //       $unwind: "$tagNames",
  //     //     },
  //     //     {
  //     //       $group: {
  //     //         _id: {
  //     //           tagName: "$tagNames",
  //     //           processId: "$additionalDetails.processId",
  //     //         },
  //     //         detail: { $first: "$additionalDetails" },
  //     //         priorityOrder: { $first: "$priorityOrder" },
  //     //         tagOrder: { $first: "$tag.order" },
  //     //       },
  //     //     },
  //     //     {
  //     //       $sort: { priorityOrder: 1, _id: -1 },
  //     //     },
  //     //     {
  //     //       $group: {
  //     //         _id: {
  //     //           tagName: "$_id.tagName",
  //     //           tagOrder: "$tagOrder",
  //     //         },
  //     //         details: { $push: "$detail" },
  //     //       },
  //     //     },
  //     //     {
  //     //       $sort: { "_id.tagOrder": 1 },
  //     //     },
  //     //     {
  //     //       $project: {
  //     //         _id: 0,
  //     //         tagName: "$_id.tagName",
  //     //         details: 1,
  //     //       },
  //     //     },
  //     //   ]);
  //     //   const serviceItemData = await this.serviceItemModel.aggregate([
  //     //     {
  //     //       $match: filter,
  //     //     },
  //     //     {
  //     //       $addFields: {
  //     //         tagNames: {
  //     //           $cond: {
  //     //             if: { $isArray: "$tag.name" },
  //     //             then: "$tag.name",
  //     //             else: ["$tag.name"],
  //     //           },
  //     //         },
  //     //       },
  //     //     },
  //     //     {
  //     //       $unwind: "$tagNames",
  //     //     },
  //     //     {
  //     //       $group: {
  //     //         _id: {
  //     //           tagName: "$tagNames",
  //     //           tagOrder: "$tag.order",
  //     //         },
  //     //         details: {
  //     //           $push: {
  //     //             $mergeObjects: [
  //     //               "$additionalDetails",
  //     //               {
  //     //                 priorityOrder: "$priorityOrder",
  //     //                 processId: "$additionalDetails.processId",
  //     //               },
  //     //             ],
  //     //           },
  //     //         },
  //     //       },
  //     //     },
  //     //     {
  //     //       $addFields: {
  //     //         details: {
  //     //           $sortArray: {
  //     //             input: "$details",
  //     //             sortBy: { priorityOrder: 1, processId: -1 },
  //     //           },
  //     //         },
  //     //       },
  //     //     },
  //     //     {
  //     //       $project: {
  //     //         _id: 0,
  //     //         tagName: "$_id.tagName",
  //     //         details: 1,
  //     //       },
  //     //     },
  //     //     {
  //     //       $sort: {
  //     //         "_id.tagOrder": 1,
  //     //       },
  //     //     },
  //     //   ]);
  //     //   console.log("service item data", JSON.stringify(serviceItemData));

  //     const processIds = serviceItemData.flatMap((item) =>
  //       item.details.map((detail) => detail.processId)
  //     );
  //     let firstTasks = await this.processService.getFirstTask(
  //       processIds,
  //       userId
  //     );
  //     const taskMap = new Map(
  //       firstTasks.map((task) => [task.processId.toString(), task])
  //     );
  //     //   console.log("taskMap", taskMap);

  //     serviceItemData.forEach((item) => {
  //       item.details = item.details.map((detail) => {
  //         const matchingTask = taskMap.get(detail.processId.toString());
  //         return {
  //           ...detail,
  //           taskDetail: matchingTask || null,
  //         };
  //       });
  //     });
  //     const finalData = serviceItemData.reduce((a, c) => {
  //       a[c.tagName] = c.details;
  //       return a;
  //     }, {});
  //     return { finalData, count };
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  async fetchServiceItemDetails(
    data,
    userId: string,
    isPagination = false,
    skip,
    limit,
    filterOption: EFilterOption
  ) {
    try {
      let filter = {
        type: EserviceItemType.courses,
        "skill.skillId": { $in: [new ObjectId(data.metaData?.skillId)] },
        status: Estatus.Active,
      };
      if (filterOption?.proficiency) {
        filter["proficiency.filterOptionId"] = new ObjectId(filterOption.proficiency);
      }

      if (filterOption?.category && filterOption?.category?.length > 0) {
        filter["category.filterOptionId"] = { $in: filterOption.category.map(id => new ObjectId(id)) };
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
      });
      const finalData = serviceItemData.reduce((a, c) => {
        a[c.tagName] = c.details;
        return a;
      }, {});
       const payload: any = { filters: [] };

    if (filterOption?.proficiency) {
      payload.filters.push({ category: EItemType.proficiency, values: [filterOption?.proficiency?.toString()] });
    }
    if (filterOption?.category && filterOption?.category?.length > 0) {
      const categoryValues = filterOption.category.map(id => id.toString());
      payload.filters.push({ category: EItemType.category, values: categoryValues });
    }

    if (payload.filters.length) {
      await this.createOrUpdateUserPreference(userId.toString(), payload);
    }
      return { finalData, count };
    } catch (err) {
      throw err;
    }

    return continueWatching;
  } catch (err) {
    throw err;
  }
}

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

    const isFirstSeriesLocked =
      userProcessedSeries?.actionData?.[0]?.taskDetail?.isLocked || false;
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
        (matchesCountry && item.type == "IAPPayment")
      ) {
        return [bannerData];
      }
      if (
        rule.isSubscribed === isNewSubscription &&
        !referralBanner
      ) {
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

async updatePageComponents(
  pageId: string,
  componentIds: Array<{
    componentId: { $oid: string },
    order: number,
    tag: string | null,
    series: any[] // TODO: Replace 'any' with proper series DTO type once defined
  }>
) {
  try {
    // console.log("Updating page components:", pageId);
    // console.log("componentIds:", componentIds);


    // Map components to the correct format
    const components = componentIds.map(item => ({
      componentId: new ObjectId(item.componentId.$oid)
    }));

    // Update page components
    const updatedPage = await this.contentPageModel.findByIdAndUpdate(
      pageId,
      {
        $set: { components }
      },
      { new: true }
    ).lean();


    // Update order for each component
    const updatePromises = componentIds.map((item, index) => {
      return this.componentModel.findByIdAndUpdate(
        item.componentId.$oid,
        {
          $set: { order: index + 1 }
        },
        { new: true }
      ).lean();
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    const skillName = await this.contentPageModel.findOne(
      { _id: pageId }
    ).lean();
    const skill = skillName?.metaData?.skill;
    // console.log("Skill Name:", skill);

    // { type: "courses", "skill.skill_name": "Singing", "tag.name": "trendingSeries"}
    const tagUpdatePromises: Promise<any>[] = [];
    componentIds.forEach((component) => {
      if (component.tag && Array.isArray(component.series)) {
        component.series.forEach((series) => {
          const query = {
            type: "courses",
            "skill.skill_name": skill,
            "tag.name": component.tag,
            "additionalDetails.processId": new ObjectId(series.seriesId.$oid),
          };
          
          // console.log("Update query:", query);
          // console.log("Setting order:", series.order, "for tag:", component.tag);
          
          // Update the order in the tag array where tag.name matches component.tag
          tagUpdatePromises.push(
            this.serviceItemModel.updateOne(
              query,
              {
                $set: {
                  "tag.$[tagElem].order": series.order
                }
              },
              {
                arrayFilters: [{ "tagElem.name": component.tag }]
              }
            )
          );
        });
      }
    });

    // Wait for all tag updates to complete
    if (tagUpdatePromises.length > 0) {
      // console.log(`Executing ${tagUpdatePromises.length} tag order updates...`);
      const results = await Promise.all(tagUpdatePromises);
      // console.log("Tag update results:", results);
      
      // Log detailed results for each update
      results.forEach((result, index) => {
        // console.log(`Update ${index + 1}:`, {
        //   matchedCount: result.matchedCount,
        //   modifiedCount: result.modifiedCount,
        //   upsertedCount: result.upsertedCount
        // });
      });
      
      // console.log("All tag order updates completed");
    }

    return {
      success: true
    };
  } catch (err) {
    console.error('Error updating page components:', err);
    throw err;
  }
  }

  async updateSeriesTag(data: any) {
  const tag = data.tag;
  const series = data.selected;
    const compId = new ObjectId(data.componentId);
    const unSelected = data.unselected;

  for (let ind = 0; ind < series.length; ind++) {
    const item = series[ind];

    // First try updating existing element
    const result = await this.serviceItemModel.updateOne(
      { "additionalDetails.processId": item.id, "tag.category_id": compId },
      {
        $set: {
          "tag.$.order": ind,
          "tag.$.name": tag,
          "tag.$.category_id": compId
        }
      }
    );

    // If no element was matched → push a new one
    if (result.matchedCount === 0) {
      await this.serviceItemModel.updateOne(
        { "additionalDetails.processId": item.id },
        {
          $push: {
            tag: {
              order: ind,
              name: tag,
              category_id: compId
            }
          }
        }
      );
    }
  }

    // console.log("UnSelected:", unSelected)
    
    for (let i = 0; i < unSelected.length; i++) {
    const item = unSelected[i];
    await this.serviceItemModel.updateOne(
      { "additionalDetails.processId": item.id },
      {
        $pull: {
          tag: { name: tag }
        }
      }
    );
  }
}
 async createOrUpdateUserPreference(userId:string, payload) {
    try {
      payload.userId = new ObjectId(userId);
      payload.isLatest = true;
      payload.status = EStatus.Active;
      const allFilterIds = payload.filters.flatMap(f => f.values).map(id => new ObjectId(id));
      const filterOptions = await this.filterOptionsModel.find({
        _id: { $in: allFilterIds },
        status: EStatus.Active
      }).lean();
      const optionKeyMap = filterOptions.reduce((acc, fo) => {
        acc[fo._id.toString()] = fo.optionKey;
        return acc;
      }, {});
      payload.filters = payload.filters.map(payloadData => ({
        ...payloadData,
        values: payloadData.values.map(data => ({
          id: data,
          optionKey: optionKeyMap[data] || null
        }))
      }));
      const existingData = await this.userFilterPreferenceModel.findOne({
        userId: payload.userId,
        status: EStatus.Active,
      }).sort({ created_at: -1 }).lean();
      if (existingData) {
        await this.userFilterPreferenceModel.findOneAndUpdate(
          { userId: payload.userId, status: EStatus.Active, _id: existingData._id },
          { $set: { isLatest: false } }
        );

        await this.userFilterPreferenceModel.create(payload);

      } else {
        await this.userFilterPreferenceModel.create(payload);
      }

    } catch (error) {
      throw error;
    }
  }
  async componentFilterOptions() {
    try {
      let filter = await this.filterTypeModel.find({
        isActive: true
      })
      const types = filter.map(item => item.type);
      const data = await this.filterOptionsModel.find({
        status: EStatus.Active,
        filterType: { $in: types }
      }).lean();
      return data
    } catch (error) {
      throw error
    }
}
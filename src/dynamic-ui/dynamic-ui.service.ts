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
import { ENavBar } from "./enum/nav-bar.enum";
import { IUserFilterPreference } from "./schema/user-filter-preference.schema";
import { IFilterType } from "./schema/filter-type.schema";
import { IFilterOption } from "./schema/filter-option.schema";
import { EFilterOption } from "./dto/filter-option.dto";
import { processModel } from "src/process/schema/process.schema";
import { EUpdateSeriesTag } from './dto/update-series-tag.dto';
import { EUpdateComponents } from './dto/update-components.dto';
import { ICategory } from "./schema/category.schema";
import { AddNewSeriesDto } from "./dto/add-new-series.dto";
import { IItemModel } from "src/item/schema/item.schema";
import { ILanguage } from "src/shared/schema/language.schema";
import { IProfileModel } from "src/shared/schema/profile.schema";
import { ISkillModel } from "src/shared/schema/skills.schema";
import { IRoleModel } from "src/shared/schema/role.schema";
import axios from "axios";
import { UserOrganizationSchema, IUserOrganizationModel } from "src/shared/schema/user-organization.schema";
import { OrganizationSchema, IOrganizationModel } from "src/shared/schema/organization.schema";
import { AddNewEpisodesDto } from "./dto/add-new-episodes.dto";
import { taskModel } from "src/process/schema/task.schema";

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
    @InjectModel("process")
    private readonly processModel: Model<processModel>,
    @InjectModel("category")
    private readonly categoryModel: Model<ICategory>,
    @InjectModel("item")
    private readonly itemModel: Model<IItemModel>,
    @InjectModel("language")
    private readonly languageModel: Model<ILanguage>,
    @InjectModel("profile")
    private readonly profileModel: Model<IProfileModel>,
    @InjectModel("skills")
    private readonly skillModel: Model<ISkillModel>,
    @InjectModel("role")
    private readonly roleModel: Model<IRoleModel>,
    @InjectModel("userOrganization")
    private readonly userOrganizationModel: Model<IUserOrganizationModel>,
    @InjectModel("organization")
    private readonly organizationModel: Model<IOrganizationModel>,
    @InjectModel("task")
    private readonly taskModel: Model<taskModel>,
    private processService: ProcessService,
    private helperService: HelperService,
    private subscriptionService: SubscriptionService,
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

      // ⭐ Add itemName to actionData after getting serviceItemData
      if (component.actionData && component.actionData.length > 0) {
        // Get all unique itemIds from actionData
        const itemIds = [...new Set(
          component.actionData
            .map(item => item.itemId)
            .filter(id => id)
        )];

        if (itemIds.length > 0) {
          // Lookup items to get itemNames
          const items = await this.itemModel
            .find({ _id: { $in: itemIds } })
            .select('_id itemName')
            .lean();

          // Create a map for quick lookup
          const itemNameMap = new Map(
            items.map(item => [item._id.toString(), item.itemName])
          );

          // Add itemName to each actionData element
          component.actionData = component.actionData.map(item => ({
            ...item,
            itemName: itemNameMap.get(item.itemId?.toString()) || null
          }));
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
      
      // ⭐ Add lookup to get item details BEFORE grouping
      aggregationPipeline.push({
        $lookup: {
          from: "item",
          localField: "itemId",
          foreignField: "_id",
          as: "itemDetails"
        }
      });
      
      // ⭐ Add itemName to the document
      aggregationPipeline.push({
        $addFields: {
          itemName: { $arrayElemAt: ["$itemDetails.itemName", 0] }
        }
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
                  { 
                    tagOrder: "$tagOrder", 
                    tagName: "$tagName",
                    itemName: "$itemName"  // ⭐ Include itemName in the merged object
                  },
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
        }} 

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
    updateDto: EUpdateComponents
  ) {
    try {
      // console.log("Updating page components:", pageId);
      // console.log("componentIds:", updateDto.components);

      // Map components to the correct format
      const components = updateDto.components.map(item => ({
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
      const updatePromises = updateDto.components.map((item, index) => {
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
      updateDto.components.forEach((component) => {
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
      }

      // console.log("tagUpdatePromises", tagUpdatePromises)

      return {
        success: true
      };
    } catch (err) {
      console.error('Error updating page components:', err);
      throw err;
    }
  }

  async updateSeriesTag(data: EUpdateSeriesTag) {
    const { tag, selected: series, componentId, unselected } = data;
    const compId = new ObjectId(componentId);

    // First, find the category document by category_name
    const categoryDoc = await this.categoryModel.findOne({ 
      category_name: tag, 
      status: 'Active' 
    }).lean();

    if (!categoryDoc) {
      throw new Error(`Category with name '${tag}' not found or not active`);
    }

    const categoryId = categoryDoc._id;

    // Process selected series - use Promise.all for parallel execution
    const selectedPromises = series.map(async (item, index) => {
      // First try updating existing element
      const result = await this.serviceItemModel.updateOne(
        { 
          "additionalDetails.processId": item.id, 
          "tag.category_id": compId 
        },
        {
          $set: {
            "tag.$.order": index,
            "tag.$.name": tag,
            "tag.$.category_id": categoryId // Use the actual category _id
          }
        }
      );
      
      // If no element was matched → push a new one
      if (result.matchedCount === 0) {
        return this.serviceItemModel.updateOne(
          { "additionalDetails.processId": item.id },
          {
            $push: {
              tag: {
                order: index,
                name: tag,
                category_id: categoryId // Use the actual category _id
              }
            }
          }
        );
      }
      return result;
    });

    // Process unselected series - use Promise.all for parallel execution
    const unselectedPromises = unselected.map(item => 
      this.serviceItemModel.updateOne(
        { "additionalDetails.processId": item.id },
        { $pull: { tag: { name: tag } } }
      )
    );

    // Execute all operations in parallel
    try {
      await Promise.all([...selectedPromises, ...unselectedPromises]);
    } catch (error) {
      console.error('Error updating series tags:', error);
      throw error;
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

  async getFilterOptions() {
    try {
      const proficiencyOptions = await this.filterOptionsModel.find({
        filterType: "proficiency",
        status: "Active"
      })
      .select('_id optionValue')
      .sort({ sortOrder: 1 })
      .lean();

      const categoryOptions = await this.filterOptionsModel.find({
        filterType: "category",
        status: "Active"
      })
      .select('_id optionValue')
      .sort({ sortOrder: 1 })
      .lean();

      return {
        proficiency: proficiencyOptions,
        category: categoryOptions
      };
    } catch (error) {
      throw error;
    }
  }

  async getExpertList() {
    try {
      const experts = await this.profileModel.find({
        type: "Expert"
      }).select("userId displayName").lean();
      // console.log("experts", experts)
      
      return experts;
    }
    catch (error) {
      throw error;
    }
  }

  async getSkillList() {
    try {
      const skills = await this.skillModel.find({
        status: "Active"
      }).select("_id skill_name").lean();
      
      // console.log("skills", skills);
      return skills;
    }
    catch (error) {
      throw error;
    }
  }

  async getRoleList() {
    try {
      const roles = await this.roleModel.find({
        status: "Active"
      }).select("_id role_name").lean();
      
      // console.log("roles", roles);
      return roles;
    }
    catch (error) {
      throw error;
    }
  }

  async getLanguageList() {
    try {
      const languages = await this.languageModel.find({
      }).select("_id language_name").lean();
      return languages;
    }
    catch (error) {
      throw error;
    }
  }

  async getSeriesData() {
    try {
      const getSeriesData = {
        filterOptions: await this.getFilterOptions(),
        experts: await this.getExpertList(),
        skills: await this.getSkillList(),
        roles: await this.getRoleList(),
        languages: await this.getLanguageList(),
      }

      return getSeriesData;
    }
    catch (error) {
      throw error;
    }
  }

  async addNewSeries(data: AddNewSeriesDto, userToken: UserToken) { 
    // Start a session for the transaction
    const session = await this.itemModel.db.startSession();
    
    try {
      // Start the transaction
      await session.withTransaction(async () => {

        const expert = await this.profileModel.findOne({
          type: "Expert",
          displayName: data.expert
        }).select("_id displayName userId").session(session).lean();

        const orgId = await this.userOrganizationModel.findOne({
          userId: new ObjectId(expert.userId),
        }).select("_id organizationId").lean();

        const org = await this.organizationModel.findOne({
          _id: orgId.organizationId,
        }).select("_id organizationName phoneCountryCode phoneNumber").lean();
        
        const newItem = await this.itemModel.create([{
          "platformItemId": new ObjectId("678e5803560c74f7eb0686b3"),
          "itemName": data.seriesName,
          "itemDescription": data.itemDescription,
          "additionalDetail": {
            "isEnableExpertQueries": data.expertQueriesEnabled,
            "reponseMode": "FormResponse",
            "maxFollowup": -1,
            "maxCustomQuestions": -1,
            "planDetails": [],
            "badgeColour": "#FFC107D4",
            "validity": "for this series",
            "promotionDetails": {
              "title": "Buy only this series ",
              "ctaName": "this series",
              "planUserSave": "Switch to Pro and save INR 1000+",
              "subtitle": "This will only unlock the series that you are currently watching",
              "payWallVideo": "https://storage.googleapis.com/ct-bucket-prod/streaming-playlists/hls/9e214537-3877-4e86-852b-5b3a8581b079/9c94c7eb-3a45-4db2-a65f-40ab986b81ca-master.m3u8",
              "paywallVisibility": true
            },
            "allowMulti": false
          },
          "itemCommissionMarkupType": "Percent",
          "itemCommissionMarkup": 0,
          "isItemCommissionIncluded": false,
          "itemStatus": "Active",
          "price": data.price,
          "currency": {
            "_id": new ObjectId("6091525bf2d365fa107635e2"),
            "currency_name": "Indian Rupee",
            "currency_code": "INR"
          },
          "status": "Active",
          "item_taxes": [
            {
              "item_tax_specification": new ObjectId("6093710eaf330d4074429afe"),
              "item_tax_id": new ObjectId("61d3dc51c62fec16fec825e8")
            }
          ],
          "comparePrice": data.comparePrice,
          "orgId": {
            "_id": org._id,
            "phoneCountryCode": org.phoneCountryCode,
            "phoneNumber": org.phoneNumber,  // ⭐ Changed from { "$numberLong": org.phoneNumber } to simple string
            "created_at": new Date(),
            "updated_at": new Date(),
            "__v": 0,
            "organizationName": org.organizationName,
            "organizationId": org._id
          }
        }], { session }); // Pass session to create operation
        const itemId = newItem[0]._id; // Note: create with session returns array
        console.log("itemId", itemId)

        // Create the process document
        const newProcess = await this.processModel.create([{
          "processMetaData": {},
          "parentProcessId": "null"
        }], { session }); // Pass session to create operation
        const processId = newProcess[0]._id; // Note: create with session returns array
        console.log("processId", processId)

        // Fetch language data
        const language = await this.languageModel.aggregate([
          {
            $match: { language_name: { $in: data.languages } }
          },
          {
            $project: {
              languageId: "$_id",                
              languageName: "$language_name",    
              languageCode: "$language_code"
            }
          }
        ], { session }); // Pass session to aggregate operation

        // Fetch skill data
        const skill = await this.skillModel.aggregate([
          {
            $match: { skill_name: { $in: data.skills } }
          },
          {
            $project: {
              skillId: "$_id",
              skillName: "$skill_name"
            }
          }
        ], { session }); // Pass session to aggregate operation

        // Fetch category data - only those matching frontend data
        const category = await this.filterOptionsModel.aggregate([
          {
            $match: {
              filterType: "category",
              status: "Active",
              optionValue: { $in: data.category }  // ⭐ Only get categories from frontend data
            }
          },
          {
            $project: {
              name: "$optionValue",
              filterOptionId: "$_id"
            }
          }
        ], { session });

        // Fetch proficiency data - only those matching frontend data
        const proficiency = await this.filterOptionsModel.aggregate([
          {
            $match: {
              filterType: "proficiency",
              status: "Active",
              optionValue: { $in: data.proficiency }  // ⭐ Only get proficiencies from frontend data
            }
          },
          {
            $project: {
              name: "$optionValue",
              filterOptionId: "$_id"
            }
          }
        ], { session });
  
        // Get the tag order length
        const tagOrder = await this.getComponent(userToken, "6857a1a98f7f9f8133738fe5", 0, 100, {})
        const tagOrderData = tagOrder.component.actionData
        const length = tagOrderData[tagOrderData.length - 1].tagOrder;

        // Create the service item document
        const newServiceItem = await this.serviceItemModel.create([{
          "itemId": new ObjectId(itemId),
          "userId": new ObjectId(expert.userId),
          "language": language,
          "status": "Active",
          "__v": 0,
          "itemSold": 0,
          "skill": {
            "skillId": new ObjectId(skill[0].skillId),
            "skillName": skill[0].skillName
          },
          "type": "courses",
          "additionalDetails": {
            "ctaName": "Start Learning",
            "navigationURL": "a",
            "thumbnail": data.thumbnail,
            "processId": new ObjectId(processId),
            "parentProcessId": new ObjectId(processId)
          },
          "tag": [
            {
              "category_id": new ObjectId("6821a3ede5095e1edae5c555"),
              "order": length + 1,
              "name": "allSeries"
            }
          ],
          "priorityOrder": 2,
          "proficiency": proficiency,
          "category": category
        }], { session }); // Pass session to create operation
        const serviceItemId = newServiceItem[0]._id;
        console.log("newServiceItem id", serviceItemId)
      });

      // If we reach here, the transaction was successful
      return {
        success: true,
        message: "Series created successfully"
      }
      
    } catch (error) {
      // Transaction will automatically rollback on error
      console.error("Transaction failed:", error);
      throw error;
    } finally {
      // Always end the session
      await session.endSession();
    }
  }

  async addNewEpisodes(data: AddNewEpisodesDto) {
    try {
      console.log("data", JSON.stringify(data, null, 2));
      
      // Start a session for the transaction
      const session = await this.taskModel.db.startSession();
      
      try {
        // Start the transaction
        const createdEpisodes = await session.withTransaction(async () => {
          // Prepare episodes for creation
          const episodesToCreate = data.episodes.map(episode => ({
            title: episode.title,
            type: episode.type,
            isLocked: episode.isLocked,
            taskNumber: episode.taskNumber,
            parentProcessId: new ObjectId(episode.parentProcessId),
            processId: new ObjectId(episode.processId),
            taskMetaData: {
              media: episode.taskMetaData.media.map(media => ({
                type: media.type,
                mediaId: media.mediaId || "",
                mediaUrl: media.mediaUrl || ""
              })),
              shareText: episode.taskMetaData.shareText || ""
            },
            status: "Active"
          }));

          // Create all episodes in the transaction
          const createdTasks = await this.taskModel.create(episodesToCreate, { session });
          
          console.log(`Successfully created ${createdTasks.length} episodes`);
          return createdTasks;
        });

        return {
          success: true,
          message: `${createdEpisodes.length} episodes created successfully`,
          seriesId: data.seriesId,
          seriesTitle: data.seriesTitle,
          createdEpisodes: createdEpisodes.map(ep => ({
            _id: ep._id,
            title: ep.title,
            taskNumber: ep.taskNumber,
            type: ep.type,
            isLocked: ep.isLocked
          }))
        };
        
      } finally {
        // Always end the session
        await session.endSession();
      }
      
    } catch (error) {
      console.error("Error creating episodes:", error);
      throw error;
    }
  }
}
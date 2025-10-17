import { SubscriptionService } from "src/subscription/subscription.service";
import { EprocessStatus, EStatus } from "./../process/enums/process.enum";
import { UserToken } from "src/auth/dto/usertoken.dto";
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model, Connection, ClientSession } from "mongoose";
import * as Sentry from "@sentry/nestjs";
import { IAppNavBar } from "./schema/app-navbar.entity";
import { IComponent } from "./schema/component.entity";
import { IContentPage } from "./schema/page-content.entity";
import { serviceitems, tagSchema } from "src/item/schema/serviceItem.schema";
import { EserviceItemType } from "src/item/enum/serviceItem.type.enum";
import { Estatus } from "src/item/enum/status.enum";
import { ProcessService } from "src/process/process.service";
import { EprofileType } from "src/item/enum/profileType.enum";
import { HelperService } from "src/helper/helper.service";
import { EsubscriptionStatus } from "src/subscription/enums/subscriptionStatus.enum";
import { ISystemConfigurationModel } from "src/shared/schema/system-configuration.schema";
import {
  EComponentItemType,
  EComponentKey,
  EComponentType,
  EConfigKeyName,
  EItemType,
} from "./enum/component.enum";
import {
  EMetabaseUrlLimit,
  EMixedPanelEvents,
} from "src/helper/enums/mixedPanel.enums";
import { log } from "console";
import { ENavBar } from "./enum/nav-bar.enum";
import { IUserFilterPreference } from "./schema/user-filter-preference.schema";
import { IFilterType } from "./schema/filter-type.schema";
import { IFilterOption } from "./schema/filter-option.schema";
import {
  ComponentFilterQueryDto,
  EFilterOption,
} from "./dto/filter-option.dto";
import { processModel } from "src/process/schema/process.schema";
import { EUpdateSeriesTag } from "./dto/update-series-tag.dto";
import { EUpdateComponents } from "./dto/update-components.dto";
import { ICategory } from "./schema/category.schema";
import { AddNewSeriesDto } from "./dto/add-new-series.dto";
import { IItemModel } from "src/item/schema/item.schema";
import { ILanguage } from "src/shared/schema/language.schema";
import { IProfileModel } from "src/shared/schema/profile.schema";
import { ISkillModel } from "src/shared/schema/skills.schema";
import { IRoleModel } from "src/shared/schema/role.schema";
import axios from "axios";
import { IUserOrganizationModel } from "src/shared/schema/user-organization.schema";
import { IOrganizationModel } from "src/shared/schema/organization.schema";
import { AddNewEpisodesDto } from "./dto/add-new-episodes.dto";
import { taskModel } from "src/process/schema/task.schema";
import { mediaModel } from "./schema/media.schema";
import { AddAchievementDto } from "./dto/add-achievement.dto";
import { Achievement, AchievementDocument } from "./schema/achievement.schema";
import { VirtualItemDocument, VirtualItem } from "./schema/virtual-item.schema";
import {
  VirtualItemGroup,
  VirtualItemGroupDocument,
} from "./schema/virtual-item-group.schema";
import { CreateVirtualItemDto } from "./dto/create-virtual-item.dto";
import { MapVirtualItemToSeriesDto } from "./dto/map-virtual-item-to-series.dto";
import { ItemType } from "./dto/map-virtual-item-to-series.dto";
import { Award, AwardDocument } from "./schema/awards.schema";
import { IBannerConfiguration } from "./schema/banner-configuration.schema";
import { ConfigService } from "@nestjs/config";
import { EAchievementType } from "src/item/enum/achievement.enum";
import { ICurrencyModel } from "src/shared/schema/currency.schema";
import { ESeriesTag, ERoleTag } from "./enum/series-tag.enum";
import { RedisService } from "src/redis/redis.service";

const { ObjectId } = require("mongodb");
@Injectable()
export class DynamicUiService {
  constructor(
    @InjectModel("appNavBar")
    private readonly appNavBarModel: Model<IAppNavBar>,
    @InjectModel("bannerConfiguration")
    private readonly bannerConfigurationModel: Model<IBannerConfiguration>,
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
    @InjectModel("media")
    private readonly mediaModel: Model<mediaModel>,
    @InjectModel(Achievement.name)
    private achievementModel: Model<AchievementDocument>,
    @InjectModel(VirtualItem.name)
    private virtualItemModel: Model<VirtualItemDocument>,
    @InjectModel(VirtualItemGroup.name)
    private virtualItemGroupModel: Model<VirtualItemGroupDocument>,
    private processService: ProcessService,
    // @Inject(forwardRef(() => HelperService))
    private helperService: HelperService,
    private subscriptionService: SubscriptionService,
    @InjectModel(Award.name)
    private awardsModel: Model<AwardDocument>,
    private configService: ConfigService,
    @InjectConnection()
    private connection: Connection,
    @InjectModel("currency")
    private currencyModel: Model<ICurrencyModel>,
    private readonly redisService: RedisService
  ) {}

  async getNavBarDetails(token: any, key: string) {
    try {
      Sentry.addBreadcrumb({
        message: "getNavBarDetails",
        level: "info",
        data: {
          token,
          key,
        },
      });
      let data = await this.appNavBarModel
        .findOne({
          key: key,
          status: EStatus.Active,
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
      Sentry.addBreadcrumb({
        message: "matchRoleByUser",
        level: "info",
        data: {
          token,
          tabs,
        },
      });
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

  async getPageDetails(
    token: UserToken,
    pageId: string,
    skip: number | undefined,
    limit: number | undefined,
    filterOption: EFilterOption
  ) {
    try {
      Sentry.addBreadcrumb({
        message: "getPageDetails",
        level: "info",
        data: {
          token,
          pageId,
          skip,
          limit,
          filterOption,
        },
      });
      const normalizedFilters = filterOption
        ? Object.keys(filterOption)
            .sort()
            .reduce((acc, k) => {
              acc[k] = (filterOption as any)[k];
              return acc;
            }, {} as any)
        : {};
      const cacheKey = `dynamicUI:getPageDetails:${token.id}:${pageId}:${skip ?? ""}:${limit ?? ""}:${JSON.stringify(
        normalizedFilters
      )}`;
      const cached = await this.redisService.getClient()?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached as string);
      }
      let data = await this.contentPageModel
        .findOne({
          _id: pageId,
          status: EStatus.Active,
        })
        .lean();
      //   console.log("data", data);
      let componentIds = data.components.map((e) => e.componentId);
      const componentDocsPromise = this.componentModel
        .find({
          _id: { $in: componentIds },
          status: EStatus.Active,
        })
        .populate("interactionData.items.banner")
        .lean();
      const serviceItemPromise = this.fetchServiceItemDetails(
        data,
        token.id,
        false,
        0,
        0,
        null
      );
      let skillId = data.metaData?.skillId;
      let skillType = data.metaData?.skill;
      const bannerIdPromise = this.helperService.getBannerToShow(
        token.id,
        skillId,
        skillType,
        EMetabaseUrlLimit.full_size_banner
      );
      const filterOptionsPromise = this.componentFilterOptions();
      const [componentDocsRaw, serviceItemData, bannerResp, filterOptions] =
        await Promise.all([
          componentDocsPromise,
          serviceItemPromise,
          bannerIdPromise,
          filterOptionsPromise,
        ]);
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
      // Resolve banner configuration document now
      let componentDocs = componentDocsRaw;
      let banners = await this.bannerConfigurationModel.find({
        _id: {
          $in: bannerResp?.bannerToShow
        },
        status: EStatus.Active,
      });
      componentDocs.forEach((comp) => {
        if (comp.type == "userPreference") {
          comp.actionData = continueWatching?.actionData;
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
      for (const comp of componentDocs) {
        if (comp.componentKey === EComponentKey.headerActionBar) {
          await this.updateHeaderActionBarComponent(comp, skillType, token.id);
        }
      }
      componentDocs.sort((a, b) => a.order - b.order);
      if (typeof limit === "number" && limit > 0) {
        const start = Math.max(
          0,
          typeof skip === "number" && isFinite(skip) ? skip : 0
        );
        const end = start + limit;
        componentDocs = componentDocs.slice(start, end);
      }
      data["components"] = componentDocs;
      const componentsWithInteractionData = componentDocs.filter(
        (comp) => comp.interactionData
      );
      if (componentsWithInteractionData.length > 0) {
        let availableFilterOptions = filterOptions;

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

        componentsWithInteractionData.forEach((component) => {
          if (
            component.componentKey === EComponentKey.learnFilterActionButton
          ) {
            const originalItems = component.interactionData?.items || [];

            const groupedOptionsMap = new Map();
            Object.values(grouped).forEach(
              (group: {
                type: string;
                filterTypeId: string;
                options: any[];
              }) => {
                groupedOptionsMap.set(group.type, group);
              }
            );

            const transformedItems = originalItems.map((item: any) => {
              let filterType = item.button?.type;

              if (filterType === "proficency") {
                filterType = "proficiency";
              }

              const groupedData = groupedOptionsMap.get(filterType);

              if (groupedData) {
                const existingOptions = item.options || [];
                const newOptions = groupedData.options || [];

                const existingOptionIds = new Set(
                  existingOptions.map((opt) => opt.filterOptionId)
                );

                const uniqueNewOptions = newOptions.filter(
                  (opt) => !existingOptionIds.has(opt.filterOptionId)
                );

                const mergedOptions = [...existingOptions, ...uniqueNewOptions];

                return {
                  ...item,
                  type: filterType,
                  filterTypeId: groupedData.filterTypeId,
                  options: mergedOptions,
                };
              }

              return item;
            });

            component.interactionData = { items: transformedItems };
          }
        });
      }
      const response = { data };
      // Cache for short TTL to reduce repeated load (e.g., 30 seconds)
      await this.redisService
        .getClient()
        ?.setEx(cacheKey, 30, JSON.stringify(response));
      return response;
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
      Sentry.addBreadcrumb({
        message: "getComponent",
        level: "info",
        data: {
          token,
          componentId,
          skip,
          limit,
          filterOption,
        },
      });
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
              (i) =>
                i.taskDetail?._id?.toString() === item.taskDetail._id.toString()
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

        if (filterOption) {
          Object.keys(filterOption).forEach((filterKey) => {
            const filterValue = filterOption[filterKey];
            const groupedData = grouped[filterKey];

            if (groupedData && filterValue) {
              if (Array.isArray(filterValue)) {
                groupedData.options.forEach((opt) => {
                  opt.isUserSelected = filterValue.includes(opt.filterOptionId);
                });
              } else {
                groupedData.options.forEach((opt) => {
                  opt.isUserSelected = opt.filterOptionId === filterValue;
                });
              }
            }
          });
        }

        if (component.componentKey === EComponentKey.learnFilterActionButton) {
          if (!component.actionData || component.actionData.length === 0) {
            const completedSeries = await this.processService.getMySeries(
              token.id,
              EprocessStatus.Completed
            );
            const completedProcessIds = new Set(
              completedSeries.map((s: any) => String(s.processId))
            );

            const allServiceItemData = await this.fetchServiceItemDetails(
              page,
              token.id,
              false,
              0,
              0,
              null
            );

            const allSeriesData = allServiceItemData.finalData?.allSeries || [];

            const nonMatchedSeries = allSeriesData.filter(
              (series: any) =>
                !completedProcessIds.has(String(series.processId))
            );

            if (nonMatchedSeries.length > 0) {
              component.recommendedList = nonMatchedSeries;
              component["totalCount"] = nonMatchedSeries.length;
            }
          }
          const originalItems = component.interactionData?.items || [];

          const groupedOptionsMap = new Map();
          Object.values(grouped).forEach(
            (group: { type: string; filterTypeId: string; options: any[] }) => {
              groupedOptionsMap.set(group.type, group);
            }
          );

          const transformedItems = originalItems.map((item: any) => {
            let filterType = item.button?.type;

            if (filterType === "proficency") {
              filterType = "proficiency";
            }

            const groupedData = groupedOptionsMap.get(filterType);

            if (groupedData) {
              const existingOptions = item.options || [];
              const newOptions = groupedData.options || [];

              const existingOptionIds = new Set(
                existingOptions.map((opt) => opt.filterOptionId)
              );

              const uniqueNewOptions = newOptions.filter(
                (opt) => !existingOptionIds.has(opt.filterOptionId)
              );

              const mergedOptions = [...existingOptions, ...uniqueNewOptions];

              return {
                ...item,
                type: filterType,
                filterTypeId: groupedData.filterTypeId,
                options: mergedOptions,
              };
            }

            return item;
          });

          component.interactionData = { items: transformedItems };
        }
      }

      // ⭐ Add itemName to actionData after getting serviceItemData
      if (component.actionData && component.actionData.length > 0) {
        // Get all unique itemIds from actionData
        const itemIds = [
          ...new Set(
            component.actionData.map((item) => item.itemId).filter((id) => id)
          ),
        ];

        if (itemIds.length > 0) {
          // Lookup items to get itemNames
          const items = await this.itemModel
            .find({ _id: { $in: itemIds } })
            .select("_id itemName")
            .lean();

          // Create a map for quick lookup
          const itemNameMap = new Map(
            items.map((item) => [item._id.toString(), item.itemName])
          );

          // Add itemName to each actionData element
          component.actionData = component.actionData.map((item) => ({
            ...item,
            itemName: itemNameMap.get(item.itemId?.toString()) || null,
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
    skip = 0,
    limit = 10,
    filterOption: EFilterOption
  ) {
    try {
      Sentry.addBreadcrumb({
        message: "fetchServiceItemDetails",
        level: "info",
        data: {
          data,
          userId,
          isPagination,
          skip,
          limit,
          filterOption,
        },
      });
      const skillId = data.metaData?.skillId;
      if (!skillId) return { finalData: {}, count: 0 };

      // Build filter
      const filter: any = {
        type: EserviceItemType.courses,
        "skill.skillId": new ObjectId(skillId),
        status: Estatus.Active,
      };
      if (filterOption) {
        Object.entries(filterOption).forEach(([key, val]) => {
          if (!val) return;
          if (Array.isArray(val)) {
            const validIds = val.filter((id) => id?.length === 24);
            if (validIds.length) {
              filter[`${key}.filterOptionId`] = {
                $in: validIds.map((id) => new ObjectId(id)),
              };
            }
          } else if (val?.length === 24) {
            filter[`${key}.filterOptionId`] = new ObjectId(val);
          }
        });
      }

      const pipeline: any[] = [
        { $match: filter },
        {
          $lookup: {
            from: "item",
            localField: "itemId",
            foreignField: "_id",
            as: "itemDetails",
          },
        },
        {
          $addFields: {
            itemName: { $arrayElemAt: ["$itemDetails.itemName", 0] },
          },
        },
        { $sort: { _id: -1 } },
        ...(isPagination ? [{ $skip: skip }, { $limit: limit }] : []),
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
        { $unwind: "$tagPairs" },
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
                    itemName: "$itemName",
                  },
                ],
              },
            },
            priorityOrder: { $first: "$priorityOrder" },
          },
        },
        { $sort: { priorityOrder: 1, "_id.processId": -1 } },
        {
          $group: {
            _id: "$_id.tagName",
            details: { $push: "$detail" },
          },
        },
        {
          $addFields: {
            details: {
              $sortArray: { input: "$details", sortBy: { tagOrder: 1 } },
            },
          },
        },
        { $project: { _id: 0, tagName: "$_id", details: 1 } },
      ];


      const result = await this.serviceItemModel.aggregate([
        {
          $match: filter,
        },
        {
          $facet: {
            data: pipeline,
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      const serviceItemData = result[0]?.data || [];
      const count = result[0]?.totalCount?.[0]?.count || 0;

      const processIds = serviceItemData.flatMap((item) =>
        item.details.map((d) => d.processId)
      );
      const firstTasks = await this.processService.getFirstTask(
        processIds,
        userId
      );

      const taskMap = new Map(
        firstTasks.map((task) => [task.processId.toString(), task])
      );

      serviceItemData.forEach((item) => {
        item.details = item.details.map((detail) => ({
          ...detail,
          taskDetail: taskMap.get(detail.processId.toString()) || null,
        }));
      });

      const finalData = serviceItemData.reduce((acc, item) => {
        acc[item.tagName] = item.details;
        return acc;
      }, {});
      return { finalData, count };
    } catch (err) {
      throw err;
    }
  }

  async fetchContinueWatching(userId: string, processIds: string[]) {
    try {
      Sentry.addBreadcrumb({
        message: "fetchContinueWatching",
        level: "info",
        data: {
          userId,
          processIds,
        },
      });
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
              pendingProcessInstanceData[i].currentTask?.taskMetaData?.media
            ),
            title: pendingProcessInstanceData[i].currentTask?.taskTitle,
            ctaName: "Continue",
            progressPercentage: pendingProcessInstanceData[i].completed,
            navigationURL:
              "process/" +
              pendingProcessInstanceData[i].processId +
              "/task/" +
              pendingProcessInstanceData[i].currentTask?._id,
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

  async fetchUserPreferenceBanner(
    isNewSubscription: boolean,
    userId: string,
    userProcessedSeries,
    components,
    countryCode: string,
    isSubscriber: boolean
  ) {
    try {
      Sentry.addBreadcrumb({
        message: "fetchUserPreferenceBanner",
        level: "info",
        data: {
          isNewSubscription,
          userId,
          userProcessedSeries,
          components,
          countryCode,
          isSubscriber,
        },
      });
      const personalizedBannerComponent = components.find(
        (c) => c.type === EComponentType.userPreferenceBanner
      );
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
          isNewSubscription == isSubscribedRule &&
          isFirstSeriesLocked == rule.isLocked &&
          item.type == "course"
        ) {
          return [bannerData];
        }
        if (
          (rule.isSubscribed != isSubscriber &&
            isFirstSeriesLocked == rule.isLocked &&
            matchesCountry &&
            item.type == "IAPPayment") ||
          (rule.isSubscribed == isNewSubscription &&
            isFirstSeriesLocked == rule.isLocked &&
            matchesCountry &&
            item.type == "IAPPayment")
        ) {
          // console.log("inside IAP payment");

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
      Sentry.addBreadcrumb({
        message: "evaluateCountryRule",
        level: "info",
        data: {
          ruleCountry,
          userCountry,
        },
      });
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
      Sentry.addBreadcrumb({
        message: "fetchSingleAdBanner",
        level: "info",
        data: {
          isNewSubscription,
          userId,
          isSubscriber,
        },
      });
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
            : premiumBannerObj?.imageUrl
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
      Sentry.addBreadcrumb({
        message: "getMentorUserIds",
        level: "info",
        data: {
          processId,
        },
      });
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

  async createOrUpdateUserPreference(userId: string, payload) {
    try {
      Sentry.addBreadcrumb({
        message: "createOrUpdateUserPreference",
        level: "info",
        data: {
          userId,
          payload,
        },
      });
      payload.userId = new ObjectId(userId);
      payload.isLatest = true;
      payload.status = EStatus.Active;
      const allFilterIds = payload.filters
        .flatMap((f) => f.values)
        .map((id) => new ObjectId(id));
      const filterOptions = await this.filterOptionsModel
        .find({
          _id: { $in: allFilterIds },
          status: EStatus.Active,
        })
        .lean();
      const optionKeyMap = filterOptions.reduce((acc, fo) => {
        acc[fo._id.toString()] = fo.optionKey;
        return acc;
      }, {});
      payload.filters = payload.filters.map((payloadData) => ({
        ...payloadData,
        values: payloadData.values.map((data) => ({
          id: data,
          optionKey: optionKeyMap[data] || null,
        })),
      }));
      const existingData = await this.userFilterPreferenceModel
        .findOne({
          userId: payload.userId,
          status: EStatus.Active,
        })
        .sort({ created_at: -1 })
        .lean();
      if (existingData) {
        await this.userFilterPreferenceModel.findOneAndUpdate(
          {
            userId: payload.userId,
            status: EStatus.Active,
            _id: existingData._id,
          },
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
      Sentry.addBreadcrumb({
        message: "componentFilterOptions",
        level: "info",
        data: {},
      });
      let filter = await this.filterTypeModel.find({
        isActive: true,
      });
      const types = filter.map((item) => item.type);
      const data = await this.filterOptionsModel
        .find({
          status: EStatus.Active,
          filterType: { $in: types },
        })
        .sort({ sortOrder: 1 })
        .lean();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async updatePageComponents(pageId: string, updateDto: EUpdateComponents) {
    try {
      Sentry.addBreadcrumb({
        message: "updatePageComponents",
        level: "info",
        data: {
          pageId,
          updateDto,
        },
      });
      // console.log("Updating page components:", pageId);
      // console.log("componentIds:", updateDto.components);

      // Map components to the correct format
      const components = updateDto.components.map((item) => ({
        componentId: new ObjectId(item.componentId),
      }));

      // Update order for each component
      updateDto.components.forEach(async (item, index) => {
        return await this.componentModel
          .updateOne(
            { _id: new ObjectId(item.componentId) },
            {
              $set: { order: index + 1 },
            }
          )
          .lean();
      });

      const skillName = await this.contentPageModel
        .findOne({ _id: pageId })
        .lean();
      const skill = skillName?.metaData?.skill;
      // console.log("Skill Name:", skill);

      updateDto.components.forEach((component) => {
        if (component.tag && Array.isArray(component.series)) {
          component.series.forEach(async (series) => {
            const query = {
              type: "courses",
              "skill.skill_name": skill,
              "tag.name": component.tag,
              "additionalDetails.processId": new ObjectId(series.seriesId),
            };

            // console.log("Update query:", query);
            // console.log("Setting order:", series.order, "for tag:", component.tag);

            // Update the order in the tag array where tag.name matches component.tag
            await this.serviceItemModel.updateOne(
              query,
              {
                $set: {
                  "tag.$[tagElem].order": series.order,
                },
              },
              {
                arrayFilters: [{ "tagElem.name": component.tag }],
              }
            );
          });
        }
      });

      return {
        success: true,
        message: "Page components updated successfully",
      };
    } catch (err) {
      console.error("Error updating page components:", err);
      throw err;
    }
  }

  async updateSeriesTag(data: EUpdateSeriesTag) {
    try {
      Sentry.addBreadcrumb({
        message: "updateSeriesTag",
        level: "info",
        data: {
          data,
        },
      });
      const { tag, selected: series, componentId, unselected } = data;
      const compId = new ObjectId(componentId);

      // First, find the category document by category_name
      const categoryDoc = await this.categoryModel
        .findOne({
          category_name: tag,
          status: EStatus.Active,
        })
        .lean();

      if (!categoryDoc) {
        throw new Error(`Category with name '${tag}' not found or not active`);
      }

      const categoryId = categoryDoc._id;
      // console.log("categoryId", categoryId);

      // Process selected series - use Promise.all for parallel execution
      series.map(async (item, index) => {
        // First, remove any existing tags with the same name to prevent duplicates
        await this.serviceItemModel.updateOne(
          { "additionalDetails.processId": item.id },
          { $pull: { tag: { name: tag } } }
        );

        // Then add the new tag with correct order
        return await this.serviceItemModel.updateOne(
          { "additionalDetails.processId": item.id },
          {
            $push: {
              tag: {
                order: index + 1,
                name: tag,
                category_id: categoryId,
              },
            },
          }
        );
      });

      // Process unselected series
      unselected.map(
        async (item) =>
          await this.serviceItemModel.updateOne(
            { "additionalDetails.processId": item.id },
            { $pull: { tag: { name: tag } } }
          )
      );

      return {
        success: true,
        message: "Series tags updated successfully",
      };
    } catch (error) {
      console.error("Error updating series tags:", error);
      throw error;
    }
  }

  async getFilterOptions() {
    try {
      Sentry.addBreadcrumb({
        message: "getFilterOptions",
        level: "info",
        data: {},
      });
      const proficiencyOptions = await this.filterOptionsModel
        .find({
          filterType: EItemType.proficiency,
          status: EStatus.Active,
        })
        .select("_id optionValue")
        .sort({ sortOrder: 1 })
        .lean();

      const categoryOptions = await this.filterOptionsModel
        .find({
          filterType: EItemType.category,
          status: EStatus.Active,
        })
        .select("_id optionValue")
        .sort({ sortOrder: 1 })
        .lean();

      return {
        proficiency: proficiencyOptions,
        category: categoryOptions,
      };
    } catch (error) {
      throw error;
    }
  }

  async getExpertList() {
    try {
      Sentry.addBreadcrumb({
        message: "getExpertList",
        level: "info",
        data: {},
      });
      const experts = await this.profileModel
        .find({
          type: "Expert",
        })
        .select("userId displayName")
        .lean();
      // console.log("experts", experts)

      return experts;
    } catch (error) {
      throw error;
    }
  }

  async getSkillList() {
    try {
      Sentry.addBreadcrumb({
        message: "getSkillList",
        level: "info",
        data: {},
      });
      const skills = await this.skillModel
        .find({
          status: EStatus.Active,
        })
        .select("_id skill_name")
        .lean();

      // console.log("skills", skills);
      return skills;
    } catch (error) {
      throw error;
    }
  }

  async getRoleList() {
    try {
      Sentry.addBreadcrumb({
        message: "getRoleList",
        level: "info",
        data: {},
      });
      const roles = await this.categoryModel.aggregate([
        {
          $match: {
            category_type: ERoleTag.role,
            status: EStatus.Active,
          },
        },
        {
          $project: { 
            _id: 1,
            role_name: "$category_name"
          },
        },
      ]);

      // console.log("roles", roles);
      return roles;
    } catch (error) {
      throw error;
    }
  }

  async getLanguageList() {
    try {
      Sentry.addBreadcrumb({
        message: "getLanguageList",
        level: "info",
        data: {},
      });
      const languages = await this.languageModel
        .find({})
        .select("_id language_name")
        .lean();
      return languages;
    } catch (error) {
      throw error;
    }
  }

  async getTagList() {
    try {
      Sentry.addBreadcrumb({
        message: "getTagList",
        level: "info",
        data: {},
      });
      const components = await this.componentModel.aggregate([
        {
          $match: {
            componentKey: {
              $in: ["course-series-card", "upcoming-series-card"],
            },
            title: { $ne: "All Series" },
          },
        },
        {
          $project: {
            tag: 1,
            title: 1,
          },
        },
      ]);
      return components;
    } catch (error) {
      throw error;
    }
  }

  async getProItem() {
    try {
      Sentry.addBreadcrumb({
        message: "getProItem",
        level: "info",
        data: {},
      });
      const proItem = await this.itemModel.find({ itemName: "PRO" })
        .select("_id itemName price").lean();
      return proItem;
    } catch (error) {
      throw error;
    }
  }

  async getSeriesData() {
    try {
      Sentry.addBreadcrumb({
        message: "getSeriesData",
        level: "info",
        data: {},
      });
      const getSeriesData = {
        filterOptions: await this.getFilterOptions(),
        experts: await this.getExpertList(),
        skills: await this.getSkillList(),
        roles: await this.getRoleList(),
        languages: await this.getLanguageList(),
        tags: await this.getTagList(),
        proItem: await this.getProItem()
      };

      return getSeriesData;
    } catch (error) {
      throw error;
    }
  }

  async getCurrencyList() {
    try {
      Sentry.addBreadcrumb({
        message: "getCurrencyList",
        level: "info",
        data: {},
      });
      const currencies = await this.currencyModel
        .find({})
        .sort({ _id: -1 })
        .select("_id currency_name currency_code")
        .lean();
      return currencies;
    } catch (error) {
      throw error;
    }
  }

  async addNewSeries(data: AddNewSeriesDto) {
    // Start a session for the transaction
    const session = await this.connection.startSession();
    try {
      Sentry.addBreadcrumb({
        message: "addNewSeries",
        level: "info",
        data: {
          data,
        },
      });
      // console.log("data", JSON.stringify(data, null, 2));
      // Start the transaction
      await session.withTransaction(async () => {
        const expert = await this.profileModel
          .findOne({
            type: EprofileType.Expert,
            _id: new ObjectId(data.expert),
          })
          .select("_id displayName userId")
          .session(session)
          .lean();

        const orgId = await this.userOrganizationModel
          .findOne({
            userId: new ObjectId(expert.userId),
          })
          .select("_id organizationId")
          .lean();

        const org = await this.organizationModel
          .findOne({
            _id: orgId.organizationId,
          })
          .select("_id organizationName phoneCountryCode phoneNumber")
          .lean();

        const newItem = await this.itemModel.create(
          [
            {
              platformItemId: new ObjectId("678e5803560c74f7eb0686b3"),
              itemName: data.seriesName,
              itemDescription: data.itemDescription,
              additionalDetail: {
                isEnableExpertQueries: data.expertQueriesEnabled,
                reponseMode: "FormResponse",
                maxFollowup: -1,
                maxCustomQuestions: -1,
                planDetails: [],
                badgeColour: "#FFC107D4",
                validity: "for this series",
                promotionDetails: {
                  title: "Buy only this series ",
                  ctaName: "this series",
                  planUserSave: "Switch to Pro and save INR 1000+",
                  subtitle:
                    "This will only unlock the series that you are currently watching",
                  // payWallVideo: "https://storage.googleapis.com/ct-bucket-prod/streaming-playlists/hls/9e214537-3877-4e86-852b-5b3a8581b079/9c94c7eb-3a45-4db2-a65f-40ab986b81ca-master.m3u8",
                  payWallVideo:
                    "https://storage.googleapis.com/ct-bucket-prod/streaming-playlists/hls/0e1c8878-b0c6-4070-b387-a7e781d8c525/ec35975b-a4ed-4c6d-9ef8-45169a4cd353-master.m3u8",
                  paywallVisibility: true,
                },
                allowMulti: false,
              },
              itemCommissionMarkupType: "Percent",
              itemCommissionMarkup: 0,
              isItemCommissionIncluded: false,
              itemStatus: EStatus.Active,
              price: data.price,
              currency: {
                _id: new ObjectId("6091525bf2d365fa107635e2"),
                currency_name: "Indian Rupee",
                currency_code: "INR",
              },
              status: EStatus.Active,
              item_taxes: [
                {
                  item_tax_specification: new ObjectId(
                    "6093710eaf330d4074429afe"
                  ),
                  item_tax_id: new ObjectId("61d3dc51c62fec16fec825e8"),
                },
              ],
              comparePrice: data.comparePrice,
              orgId: {
                _id: org._id,
                phoneCountryCode: org.phoneCountryCode,
                phoneNumber: org.phoneNumber, // ⭐ Changed from { "$numberLong": org.phoneNumber } to simple string
                created_at: new Date(),
                updated_at: new Date(),
                organizationName: org.organizationName,
                organizationId: org._id,
              },
            },
          ],
          { session }
        ); // Pass session to create operation
        const itemId = newItem[0]._id; // Note: create with session returns array
        // console.log("itemId", itemId);

        // Create the process document
        const newProcess = await this.processModel.create(
          [
            {
              processMetaData: {},
              parentProcessId: "null",
            },
          ],
          { session }
        ); // Pass session to create operation
        const processId = newProcess[0]._id; // Note: create with session returns array
        // console.log("processId", processId);

        // Fetch language data
        const languageIds = data.languages.map((id) => new ObjectId(id));
        const language = await this.languageModel.aggregate(
          [
            {
              $match: { _id: { $in: languageIds } },
            },
            {
              $project: {
                languageId: "$_id",
                languageName: "$language_name",
                languageCode: "$language_code",
              },
            },
          ],
          { session }
        ); // Pass session to aggregate operation // Pass session to aggregate operation

        // Fetch skill data
        const skillIds = data.skills.map((id) => new ObjectId(id));
        const skill = await this.skillModel.aggregate(
          [
            {
              $match: { _id: { $in: skillIds } },
            },
            {
              $project: {
                skillId: "$_id",
                skill_name: "$skill_name",
              },
            },
          ],
          { session }
        ); // Pass session to aggregate operation
        // console.log("skill", skill);

        // Fetch category data - only those matching frontend data
        const category = await this.filterOptionsModel.aggregate(
          [
            {
              $match: {
                filterType: EItemType.category,
                status: EStatus.Active,
                optionValue: { $in: data.category }, // ⭐ Only get categories from frontend data
              },
            },
            {
              $project: {
                name: "$optionValue",
                filterOptionId: "$_id",
              },
            },
          ],
          { session }
        );

        // Fetch proficiency data - only those matching frontend data
        const proficiency = await this.filterOptionsModel.aggregate(
          [
            {
              $match: {
                filterType: EItemType.proficiency,
                status: EStatus.Active,
                optionValue: { $in: data.proficiency }, // ⭐ Only get proficiencies from frontend data
              },
            },
            {
              $project: {
                name: "$optionValue",
                filterOptionId: "$_id",
              },
            },
          ],
          { session }
        );

        const role = await this.categoryModel.aggregate([
          {
            $match: {
              _id: { $in: data.roles.map((id) => new ObjectId(id)) },
            },
          },
          {
            $project: {
              _id: 1,
              role_name: "$category_name",
            },
          },
        ]);
        // console.log("role", role);

        const componentId = await this.componentModel
          .findOne({
            title: "All Series",
          })
          .select("tag")
          .lean();

        // ⭐ Optimized: get highest "allSeries" order via aggregation (desc sort + limit 1)
        const [allSeriesMax] = await this.serviceItemModel
          .aggregate([
            {
              $match: {
                "tag.name": ESeriesTag.allSeries,
                "skill.skillId": skillIds[0],
              },
            },
            { $unwind: "$tag" },
            { $match: { "tag.name": ESeriesTag.allSeries } },
            { $sort: { "tag.order": -1 } },
            { $limit: 1 },
            { $project: { _id: 0, order: "$tag.order" } },
          ])
          .exec();

        const highestAllSeriesOrder = allSeriesMax?.order ?? 0;
        const length = highestAllSeriesOrder;

        // Precompute all tag data before creating the service item
        const tagsData = data.tags;
        const additionalTags = [];

        // Process all tags sequentially to get proper order calculations
        for (const tag of tagsData) {
          const categoryData = await this.categoryModel
            .findOne({
              category_name: tag,
            })
            .select("_id category_name")
            .lean();

          // ⭐ Optimized: get highest order for this tag via aggregation
          const [maxTagOrder] = await this.serviceItemModel
            .aggregate([
              {
                $match: {
                  "tag.name": tag,
                  "skill.skillId": skillIds[0],
                },
              },
              { $unwind: "$tag" },
              { $match: { "tag.name": tag } },
              { $sort: { "tag.order": -1 } },
              { $limit: 1 },
              { $project: { _id: 0, order: "$tag.order" } },
            ])
            .exec();

          const highestOrder = maxTagOrder?.order ?? 0;

          const tagData = {
            category_id: categoryData._id,
            order: highestOrder + 1,
            name: categoryData.category_name,
          };

          additionalTags.push(tagData);
        }

        // Prepare the complete tag array including the default "allSeries" tag
        const allTags = [
          {
            category_id: new ObjectId(componentId.tag.tagId.toString()),
            order: length + 1,
            name: ESeriesTag.allSeries,
          },
          ...additionalTags,
        ];

        // Create the service item document with all tags in a single operation
        const newServiceItem = await this.serviceItemModel.create(
          [
            {
              itemId: new ObjectId(itemId),
              userId: new ObjectId(expert.userId),
              language: language,
              status: EStatus.Active,
              itemSold: 0,
              role: role.map((item) => ({
                roleId: new ObjectId(item._id),
                roleName: item.role_name,
              })),
              skill: {
                skillId: new ObjectId(skillIds[0]),
                skill_name: skill[0].skill_name,
              },
              type: "courses",
              additionalDetails: {
                ctaName: "Start Learning",
                navigationURL: "a",
                thumbnail: data.thumbnail,
                processId: new ObjectId(processId),
                parentProcessId: new ObjectId(processId),
              },
              tag: allTags,
              priorityOrder: 100,
              proficiency: proficiency,
              category: category,
              planItemId: [
                {
                  itemName: data.proItem.itemName,
                  itemId: data.proItem._id,
                },
              ],
            },
          ],
          { session }
        ); // Pass session to create operation

        const serviceItemId = newServiceItem[0]._id;
        // console.log("newServiceItem id", serviceItemId);

        // console.log("tags at last", tags)
      });
      // If we reach here, the transaction was successful
      return {
        success: true,
        message: "Series created successfully",
      };
    } catch (error) {
      // Transaction will automatically rollback on error
      console.error("Transaction failed:", error);
      throw error;
    } finally {
      // Always end the session
      await session.endSession();
    }
  }

  /**
   * Process advertisement episode metadata
   */
  private async processAdvertisementEpisode(episode: any, session: any) {
    Sentry.addBreadcrumb({
      message: "processAdvertisementEpisode",
      level: "info",
      data: {
        episode,
      },
    });
    const processedMedia = await Promise.all(
      episode.taskMetaData.media.map(async (media) => {
        let mediaId = media.mediaId.toString();

        if (media.type === "story" && mediaId) {
          const loc = await this.lookupStoryMediaLocation(mediaId, session);
          if (loc) {
            return {
              type: media.type,
              mediaId: new ObjectId(mediaId), // advertisement requires ObjectId
              mediaUrl: loc,
            };
          }
        }

        // For non-story types or if lookup fails, use original data
        return {
          type: media.type,
          mediaId: new ObjectId(mediaId), // Convert ALL mediaIds to ObjectId for advertisement episodes
          mediaUrl: media.mediaUrl,
        };
      })
    );

    const advMetaData = episode.taskMetaData as any;
    return {
      media: processedMedia,
      shareText: advMetaData.shareText,
      redirectionUrl: advMetaData.redirectionUrl,
      type: advMetaData.type,
      expertId: new ObjectId(advMetaData.expertId),
      ctaname: advMetaData.ctaname,
    };
  }

  /**
   * Process break episode metadata
   */
  private async processBreakEpisode(episode: any, session: any) {
    Sentry.addBreadcrumb({
      message: "processBreakEpisode",
      level: "info",
      data: {
        episode,
      },
    });
    const processedMedia = await Promise.all(
      episode.taskMetaData.media.map(async (media) => {
        let mediaId = media.mediaId.toString();

        if (media.type === "story" && mediaId) {
          const loc = await this.lookupStoryMediaLocation(mediaId, session);
          if (loc) {
            return {
              type: media.type,
              mediaId: mediaId, // Break stores as string
              mediaUrl: loc,
            };
          }
        }

        // For non-story types or if lookup fails, use original data
        return {
          type: media.type,
          mediaId: mediaId, // Store as string for Break episodes
          mediaUrl: media.mediaUrl,
        };
      })
    );

    const breakMetaData = episode.taskMetaData as any;
    return {
      timeDurationInMin: breakMetaData.timeDurationInMin,
      media: processedMedia,
      shareText: breakMetaData.shareText,
    };
  }

  /**
   * Process Q&A episode metadata
   */
  private async processQAEpisode(episode: any, session: any) {
    Sentry.addBreadcrumb({
      message: "processQAEpisode",
      level: "info",
      data: {
        episode,
      },
    });
    const qaMetaData = episode.taskMetaData as any;

    // Handle media if present (some Q&A might not have media)
    let processedMedia = [];
    if (qaMetaData.media && Array.isArray(qaMetaData.media)) {
      processedMedia = await Promise.all(
        qaMetaData.media.map(async (media) => {
          if (media.type === "story" && media.mediaId) {
            const id = media.mediaId.toString();
            const loc = await this.lookupStoryMediaLocation(id, session);
            if (loc) {
              return {
                type: media.type,
                mediaId: id, // Q&A uses string id here
                mediaUrl: loc,
              };
            }
          }
          return {
            type: media.type,
            mediaId: media.mediaId,
            mediaUrl: media.mediaUrl,
          };
        })
      );
    }

    // Copy mediaUrl from first media item to use as questionMediaUrl
    let questionMediaUrl = qaMetaData.questionMediaUrl;
    if (processedMedia.length > 0 && processedMedia[0].mediaUrl) {
      questionMediaUrl = processedMedia[0].mediaUrl;
    }

    return {
      question: qaMetaData.question,
      questionType: qaMetaData.questionType,
      questionMediaUrl: questionMediaUrl,
      responseFormat: qaMetaData.responseFormat,
      response: qaMetaData.response,
      options: qaMetaData.options,
      correctAnswer: qaMetaData.correctAnswer,
      isSkippable: !!qaMetaData.isSkippable,
      media: processedMedia,
      shareText: qaMetaData.shareText,
    };
  }

  /**
   * Process default episode metadata (video/audio episodes)
   */
  private async processDefaultEpisode(episode: any, session: any) {
    Sentry.addBreadcrumb({
      message: "processDefaultEpisode",
      level: "info",
      data: {
        episode,
      },
    });
    const processedMedia = await Promise.all(
      episode.taskMetaData.media.map(async (media) => {
        if (media.type === "story" && media.mediaId) {
          const loc = await this.lookupStoryMediaLocation(
            media.mediaId,
            session
          );
          if (loc) {
            return {
              type: media.type,
              mediaId: media.mediaId, // default flow keeps original format
              mediaUrl: loc,
            };
          }
        }
        return {
          type: media.type,
          mediaId: media.mediaId,
          mediaUrl: media.mediaUrl,
        };
      })
    );

    return {
      media: processedMedia,
      shareText: episode.taskMetaData.shareText,
    };
  }

  async addNewEpisodes(data: AddNewEpisodesDto) {
    try {
      Sentry.addBreadcrumb({
        message: "addNewEpisodes",
        level: "info",
        data: {
          data,
        },
      });
      // Start a session for the transaction
      const session = await this.taskModel.db.startSession();

      try {
        // Start the transaction
        const createdEpisodes = await session.withTransaction(async () => {
          // Prepare episodes for creation
          const episodesToCreate = await Promise.all(
            data.episodes.map(async (episode) => {
              let taskMetaData;

              // Process episode based on type using dedicated functions
              switch (episode.type) {
                case "advertisement":
                  taskMetaData = await this.processAdvertisementEpisode(
                    episode,
                    session
                  );
                  break;
                case "Break":
                  taskMetaData = await this.processBreakEpisode(
                    episode,
                    session
                  );
                  break;
                case "Q&A":
                  taskMetaData = await this.processQAEpisode(episode, session);
                  break;
                default:
                  // For video/audio episodes (existing logic)
                  taskMetaData = await this.processDefaultEpisode(
                    episode,
                    session
                  );
                  break;
              }

              return {
                title: episode.title,
                type: episode.type,
                isLocked: episode.isLocked,
                taskNumber: episode.taskNumber,
                parentProcessId: new ObjectId(episode.parentProcessId),
                processId: new ObjectId(episode.processId),
                taskMetaData: taskMetaData,
                status: EStatus.Active,
              };
            })
          );

          // Create all episodes in the transaction
          const createdTasks = await this.taskModel.create(episodesToCreate, {
            session,
            ordered: true,
          });

          return createdTasks;
        });

        return {
          success: true,
          message: `${createdEpisodes.length} episodes created successfully`,
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

  async addNewAchievement(payload: AddAchievementDto) {
    try {
      Sentry.addBreadcrumb({
        message: "addNewAchievement",
        level: "info",
        data: {
          payload,
        },
      });
      const uploadData = {
        key: EAchievementType.course_complete,
        title: EAchievementType.title,
        type: EAchievementType.certificate,
        metaData: {
          shareOptions: {
            text: payload.shareText,
          },
          templateUrl: payload.image.mediaUrl,
          textColor: payload.color,
        },
        status: EStatus.Active,
        sourceId: new ObjectId(payload.processId),
        sourceType: "process",
        visibilityStatus: true,
        provider: "casttree",
        version: 1,
        description: "string",
        createdBy: new ObjectId(payload.processId),
        updatedBy: new ObjectId(payload.processId),
      };

      const res = await this.achievementModel.create(uploadData);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async updateEpisodeMedia(payload: { seriesId: string }) {
    try {
      Sentry.addBreadcrumb({
        message: "updateEpisodeMedia",
        level: "info",
        data: {
          payload,
        },
      });
      const seriesId = payload.seriesId;

      // First, get all tasks with their media
      const series = await this.taskModel.aggregate([
        {
          $match: {
            processId: new ObjectId(seriesId),
          },
        },
        {
          $project: {
            _id: 1,
            "taskMetaData.media": 1,
            type: 1,
          },
        },
      ]);

      // Process each task and update story media URLs
      const updatePromises = series.map(async (task) => {
        const taskId = task._id;
        const media = task.taskMetaData?.media;
        const type = task.type;
        // console.log(task, type)

        // Filter only story type media
        const storyMedia = media.filter((m) => m.type === "story");

        if (storyMedia.length === 0) return null; // Skip if no story media

        // Update each story media item
        const mediaUpdatePromises = storyMedia.map(
          async (mediaItem, mediaIndex) => {
            try {
              // console.log("mediaItem", mediaItem);

              // Only update if the old URL starts with the specified domain
              if (
                !mediaItem.mediaUrl.startsWith(
                  this.configService.get("PEERTUBE_BASE_URL")
                )
              ) {
                console.log(
                  `Skipping media item ${mediaIndex} - URL doesn't match required domain`
                );
                return null;
              }

              // Call external endpoint to get new URL
              const newMediaUrl = await this.helperService.generateNewMediaUrl(
                mediaItem.mediaUrl
              );
              // console.log("newMediaUrl", newMediaUrl);

              // Check if the new URL still points to the original domain (video not transcoded yet)
              if (
                newMediaUrl.startsWith(
                  this.configService.get("PEERTUBE_BASE_URL")
                )
              ) {
                console.log(
                  `Video not transcoded yet for media ${mediaItem.mediaId}`
                );
                return {
                  status: "pending",
                  message:
                    "Video has not been transcoded yet. Please wait and try again.",
                  mediaId: mediaItem.mediaId,
                };
              }

              // Update the specific media item in the array
              const res = await this.taskModel.updateOne(
                {
                  _id: taskId,
                  "taskMetaData.media": {
                    $elemMatch: {
                      type: "story",
                      mediaId: mediaItem.mediaId,
                    },
                  },
                },
                {
                  $set: {
                    "taskMetaData.media.$.mediaUrl": newMediaUrl,
                    "taskMetaData.questionMediaUrl":
                      type === "Q&A" ? newMediaUrl : "",
                  },
                }
              );

              // console.log("res", res);
              return res;
            } catch (error) {
              console.error(
                `Failed to update media URL for task ${taskId}, media index ${mediaIndex}:`,
                error
              );
              return null;
            }
          }
        );

        return Promise.all(mediaUpdatePromises);
      });

      // Execute all updates
      await Promise.all(updatePromises.filter(Boolean));

      return {
        success: true,
        message: "Episode media URLs updated successfully",
      };
    } catch (error) {
      console.error("Error updating episode media:", error);
      throw error;
    }
  }

  async addGiftGroup(payload: {
    giftGroupId: string;
    seriesId: string;
    type: string;
  }) {
    try {
      Sentry.addBreadcrumb({
        message: "addGiftGroup",
        level: "info",
        data: {
          payload,
        },
      });
      // console.log("payload", payload);
      const findGroup = await this.virtualItemGroupModel.findOne({
        _id: payload.giftGroupId,
      });

      if (findGroup) {
        findGroup.source.push({
          sourceId: new ObjectId(payload.seriesId),
          sourceType: payload.type,
        });
        await findGroup.save();
      } else {
        throw new Error("Group not found");
      }
      return {
        success: true,
        message: "Group added successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async getVirtualItemGroup() {
    try {
      Sentry.addBreadcrumb({
        message: "getVirtualItemGroup",
        level: "info",
        data: {},
      });
      const res = await this.virtualItemGroupModel.aggregate().project({
        _id: 1,
        virtualItemGroupName: 1,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getVirtualItemList(type: string) {
    try {
      Sentry.addBreadcrumb({
        message: "getVirtualItemList",
        level: "info",
        data: {
          type,
        },
      });
      const res = await this.virtualItemModel
        .aggregate([
          {
            $match: {
              type: type,
            },
          },
        ])
        .project({
          _id: 1,
          name: 1,
          mediaUrl: { $arrayElemAt: ["$media.mediaUrl", 0] },
        });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async createVirtualItem(payload: CreateVirtualItemDto) {
    try {
      Sentry.addBreadcrumb({
        message: "createVirtualItem",
        level: "info",
        data: {
          payload,
        },
      });
      const uploadData = {
        name: payload.name,
        type: payload.type, // Now handles both "queries" and "gift"
        media: [],
        isPayable: payload.isPayable,
        status: EStatus.Active,
        payableType: new ObjectId(payload.currencyId),
        comparePrice: payload.comparePrice || payload.price,
        description: payload.description,
        shortDescription: "",
        payableValue: payload.price,
        source: [],
      };

      if (payload.type === "gift") {
        uploadData["media"] = [payload.media];
      }

      if (payload.type === "gift" && payload.isPayable) {
        uploadData["stickerSound"] =
          "https://tecxprt-media.sgp1.digitaloceanspaces.com/1750832546781WhatsApp%20Audio%202025-06-25%20at%2010.58.24%20AM.mpeg";
        uploadData["stickerGif"] =
          "https://tecxprt-media.sgp1.digitaloceanspaces.com/1750832457037Animation%20-%201750829319104.json";
      } else {
        uploadData["stickerSound"] =
          "https://storage.googleapis.com/download/storage/v1/b/ct-bucket-prod/o/1750874302452pop%20sound.mp3?generation=1750874300873927&alt=media";
        uploadData["stickerGif"] =
          "https://tecxprt-media.sgp1.digitaloceanspaces.com/1744786545186confetti.json";
      }

      if (payload.type === "queries") {
        delete uploadData["stickerSound"];
        delete uploadData["stickerGif"];
      }

      // console.log("uploadData", uploadData);

      const res = await this.virtualItemModel.create(uploadData);

      return {
        success: true,
        message: `${payload.type === "gift" ? "Gift" : "Query"} created successfully`,
        data: res,
      };
    } catch (error) {
      console.error("=== DEBUG: Error creating query ===", error);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  async createVirtualItemGroup(payload: {
    groupName: string;
    giftIds: string[];
  }) {
    try {
      Sentry.addBreadcrumb({
        message: "createVirtualItemGroup",
        level: "info",
        data: {
          payload,
        },
      });
      // console.log("payload", payload);
      const uploadData = {
        source: [],
        virtualItemGroupName: payload.groupName,
        virtualItemIds: payload.giftIds.map((id) => new ObjectId(id)),
      };
      // console.log("uploadData", uploadData);
      const res = await this.virtualItemGroupModel.create(uploadData);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async mapVirtualItemToSeries(payload: MapVirtualItemToSeriesDto) {
    try {
      Sentry.addBreadcrumb({
        message: "mapVirtualItemToSeries",
        level: "info",
        data: {
          payload,
        },
      });
      const compId = payload.seriesId ? payload.seriesId : payload.awardId;
      const compType = payload.seriesId ? "process" : "award";
      const itemIds = payload.itemIds;

      const itemType = payload.itemType;

      if (itemType === ItemType.GIFT_GROUPS) {
        const res = await this.addGiftGroup({
          giftGroupId: itemIds[0],
          seriesId: compId,
          type: compType,
        });
        return res;
      }

      const res = await this.virtualItemModel.updateMany(
        { _id: { $in: itemIds } },
        {
          $push: {
            source: {
              sourceId: new ObjectId(compId),
              sourceType: compType,
            },
          },
        }
      );
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getAwardList() {
    try {
      Sentry.addBreadcrumb({
        message: "getAwardList",
        level: "info",
        data: {},
      });
      const res = await this.awardsModel.find({}).select("_id title");
      return res;
    } catch (error) {
      throw error;
    }
  }

  private async lookupStoryMediaLocation(
    mediaId: any,
    session?: ClientSession
  ): Promise<string | null> {
    try {
      Sentry.addBreadcrumb({
        message: "lookupStoryMediaLocation",
        level: "info",
        data: {
          mediaId,
        },
      });
      let query = this.mediaModel
        .findOne({ _id: new ObjectId(mediaId.toString()) })
        .select("location");

      const mediaDoc = await query.lean();
      return mediaDoc?.location ?? null;
    } catch (e) {
      console.warn(`Failed to lookup media for mediaId: ${mediaId}`, e);
      return null;
    }
  }

  async getFilterComponent(
    token: UserToken,
    componentId: string,
    query: ComponentFilterQueryDto,
    filterOption: EFilterOption
  ) {
    try {
      Sentry.addBreadcrumb({
        message: "getFilterComponent",
        level: "info",
        data: {
          token,
          componentId,
          query,
          filterOption,
        },
      });
      const { skip, limit } = query;
      const [baseComponent, actualComponent, page] =
        await this.fetchBaseComponents(componentId);
      if (!baseComponent) {
        throw new NotFoundException("Filter component not found");
      }
      const tagName = actualComponent?.tag?.tagName;

      const { serviceItemData, filteredData } = await this.fetchServiceItemData(
        page,
        token.id,
        tagName,
        skip,
        limit,
        filterOption
      );
      const componentFilterData = await this.getComponentFilterOptions(
        componentId,
        token,
        filterOption
      );
      const finalInteractionData =
        componentFilterData?.interactionData?.items || [];
      const processedFilterOptions = await this.processFilterOptions(
        finalInteractionData,
        filterOption
      );
      this.updateBaseComponentWithFilterData(
        baseComponent,
        finalInteractionData,
        processedFilterOptions,
        filteredData
      );
      const totalCount = await this.calculateTotalCount(
        serviceItemData,
        tagName,
        token.id,
        filterOption
      );
      baseComponent["totalCount"] = totalCount;

      if (!filteredData || filteredData.length === 0) {
        const completedSeries = await this.processService.getMySeries(
          token.id,
          EprocessStatus.Completed
        );
        const completedProcessIds = new Set(
          completedSeries.map((s: any) => String(s.processId))
        );

        const allServiceItemData = await this.fetchServiceItemDetails(
          page,
          token.id,
          false,
          0,
          0,
          null
        );

        const allSeriesData = allServiceItemData.finalData?.allSeries || [];

        const nonMatchedSeries = allSeriesData.filter(
          (series: any) =>
            !completedProcessIds.has(String(series.processId))
        );

        if (nonMatchedSeries.length > 0) {
          baseComponent.recommendedList = nonMatchedSeries;
          baseComponent["totalCount"] = nonMatchedSeries.length;
        }
      }
      
      return { component: baseComponent };
    } catch (err) {
      throw err;
    }
  }

  private async fetchBaseComponents(componentId: string) {
    Sentry.addBreadcrumb({
      message: "fetchBaseComponents",
      level: "info",
      data: {
        componentId,
      },
    });
    const [baseComponent, actualComponent, page] = await Promise.all([
      this.componentModel
        .findOne({
          componentKey: EComponentKey.filterActionButton,
          status: EStatus.Active,
        })
        .lean(),
      this.componentModel
        .findOne({
          _id: componentId,
          status: EStatus.Active,
        })
        .lean(),
      this.contentPageModel
        .findOne({
          "components.componentId": componentId,
        })
        .lean(),
    ]);

    return [baseComponent, actualComponent, page] as [any, any, any];
  }

  private async fetchServiceItemData(
    page: any,
    userId: string,
    tagName: string,
    skip: number,
    limit: number,
    filterOption: EFilterOption
  ) {
    Sentry.addBreadcrumb({
      message: "fetchServiceItemData",
      level: "info",
      data: {
        page,
        userId,
        tagName,
        skip,
        limit,
        filterOption,
      },
    });
    let serviceItemData;
    let filteredData: any[] = [];

    if (page) {
      serviceItemData = await this.fetchServiceItemDetails(
        page,
        userId,
        false,
        0,
        0,
        filterOption
      );

      if (tagName && serviceItemData?.finalData?.[tagName]) {
        const allTagData = serviceItemData.finalData[tagName];
        filteredData = allTagData.slice(skip, skip + limit);
      }
    }

    return { serviceItemData, filteredData };
  }

  private async processFilterOptions(
    finalInteractionData: any[],
    filterOption: EFilterOption
  ) {
    Sentry.addBreadcrumb({
      message: "processFilterOptions",
      level: "info",
      data: {
        finalInteractionData,
        filterOption,
      },
    });
    const componentFilterTypes = this.extractFilterTypes(finalInteractionData);
    const availableFilterOptions = await this.componentFilterOptions();

    const filteredOptions =
      componentFilterTypes.length > 0
        ? availableFilterOptions.filter((opt) =>
            componentFilterTypes.includes(opt.filterType)
          )
        : availableFilterOptions;

    const grouped = this.groupFilterOptions(filteredOptions);
    this.applyUserSelections(grouped, filterOption);

    return grouped;
  }

  private extractFilterTypes(finalInteractionData: any[]): string[] {
    Sentry.addBreadcrumb({
      message: "extractFilterTypes",
      level: "info",
      data: {
        finalInteractionData,
      },
    });
    const componentFilterTypes: string[] = [];

    if (finalInteractionData.length > 0) {
      finalInteractionData.forEach((item: any) => {
        if (item.button?.type || item.type) {
          let filterType = item.button?.type || item.type;
          if (filterType === "proficency") {
            filterType = "proficiency";
          }
          componentFilterTypes.push(filterType);
        }
      });
    }

    return componentFilterTypes;
  }

  private groupFilterOptions(filteredOptions: any[]) {
    Sentry.addBreadcrumb({
      message: "groupFilterOptions",
      level: "info",
      data: {
        filteredOptions,
      },
    });
    return filteredOptions.reduce((acc, opt) => {
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
  }

  private applyUserSelections(grouped: any, filterOption: EFilterOption) {
    Sentry.addBreadcrumb({
      message: "applyUserSelections",
      level: "info",
      data: {
        grouped,
        filterOption,
      },
    });
    if (!filterOption) return;

    Object.keys(filterOption).forEach((filterKey) => {
      const filterValue = filterOption[filterKey];
      const groupedData = grouped[filterKey];

      if (groupedData && filterValue) {
        if (Array.isArray(filterValue)) {
          groupedData.options.forEach((opt: any) => {
            opt.isUserSelected = filterValue.includes(opt.filterOptionId);
          });
        } else {
          groupedData.options.forEach((opt: any) => {
            opt.isUserSelected = opt.filterOptionId === filterValue;
          });
        }
      }
    });
  }

  private updateBaseComponentWithFilterData(
    baseComponent: any,
    finalInteractionData: any[],
    processedFilterOptions: any,
    filteredData: any[]
  ) {
    Sentry.addBreadcrumb({
      message: "updateBaseComponentWithFilterData",
      level: "info",
      data: {
        baseComponent,
        finalInteractionData,
        processedFilterOptions,
        filteredData,
      },
    });
    if (baseComponent?.interactionData) {
      const groupedOptionsMap = new Map();
      Object.values(processedFilterOptions).forEach(
        (group: { type: string; filterTypeId: string; options: any[] }) => {
          groupedOptionsMap.set(group.type, group);
        }
      );

      const transformedItems = finalInteractionData.map((item: any) => {
        let filterType = item.button?.type || item.type;
        if (filterType === "proficency") {
          filterType = "proficiency";
        }
        const groupedData = groupedOptionsMap.get(filterType);

        if (groupedData) {
          const existingOptions = item.options || [];
          const newOptions = groupedData.options || [];

          const existingOptionIds = new Set(
            existingOptions.map((opt: any) => opt.filterOptionId)
          );

          const uniqueNewOptions = newOptions.filter(
            (opt: any) => !existingOptionIds.has(opt.filterOptionId)
          );

          const mergedOptions = [...existingOptions, ...uniqueNewOptions];

          return {
            ...item,
            type: filterType,
            filterTypeId: groupedData.filterTypeId,
            options: mergedOptions,
          };
        }

        return item;
      });

      baseComponent.interactionData = { items: transformedItems };
    }

    baseComponent.actionData = filteredData;
  }

  private async calculateTotalCount(
    serviceItemData: any,
    tagName: string,
    userId: string,
    filterOption: EFilterOption
  ): Promise<number> {
    Sentry.addBreadcrumb({
      message: "calculateTotalCount",
      level: "info",
      data: {
        serviceItemData,
        tagName,
        userId,
        filterOption,
      },
    });
    if (tagName && serviceItemData?.finalData?.[tagName]) {
      return await this.getTagNameTotalCount(
        serviceItemData,
        tagName,
        userId,
        filterOption
      );
    }
    return 0;
  }

  // async getComponentFilterOptions(
  //   componentId: string,
  //   token?: UserToken,
  //   filterOption?: EFilterOption
  // ): Promise<any> {
  //   try {
  //     const filterTypes = await this.filterTypeModel
  //       .find({ "source.sourceId": new ObjectId(componentId), isActive: true })
  //       .sort({ sortOrder: 1 })
  //       .lean();

  //     if (!filterTypes?.length) {
  //       return {
  //         componentId,
  //         filterTypes: [],
  //         interactionData: { items: [] },
  //       };
  //     }

  //     const filterTypeIds = filterTypes.map(ft => ft._id);
  //     const filterOptions = await this.filterOptionsModel
  //       .find({ filterTypeId: { $in: filterTypeIds }, status: EStatus.Active })
  //       .sort({ sortOrder: 1 })
  //       .lean();

  //     const groupedOptions = filterOptions.reduce<Record<string, any[]>>((acc, option) => {
  //       const filterTypeId = option.filterTypeId.toString();
  //       if (!acc[filterTypeId]) acc[filterTypeId] = [];

  //       acc[filterTypeId].push({
  //         filterOptionId: option._id.toString(),
  //         filterType: option.filterType,
  //         optionKey: option.optionKey,
  //         optionValue: option.optionValue,
  //         description: option.description,
  //         icon: option.icon,
  //         color: option.color,
  //         metaData: option.metaData,
  //       });

  //       return acc;
  //     }, {});

  //     const interactionItems = filterTypes.map(ft => {
  //       const filterTypeId = ft._id.toString();
  //       const options = groupedOptions[filterTypeId] || [];
  //       const userValue = filterOption?.[ft.type];

  //       const mappedOptions = options.map(option => ({
  //         ...option,
  //         isUserSelected: Array.isArray(userValue)
  //           ? userValue.includes(option.filterOptionId)
  //           : userValue === option.filterOptionId,
  //       }));

  //       return {
  //         button: {
  //           type: ft.type,
  //           lable: ft.displayName,
  //           selectionType: ft.validationRules?.maxSelections > 1 ? "multiple" : "single",
  //         },
  //         type: ft.type,
  //         filterTypeId,
  //         options: mappedOptions,
  //       };
  //     });

  //     return {
  //       componentId,
  //       interactionData: { items: interactionItems },
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async getComponentFilterOptions(
    componentId: string,
    token?: UserToken,
    filterOption?: EFilterOption
  ): Promise<any> {
    try {
      Sentry.addBreadcrumb({
        message: "getComponentFilterOptions",
        level: "info",
        data: {
          componentId,
          token,
          filterOption,
        },
      });
      const componentObjectId = new ObjectId(componentId);

      // Step 1: Fetch filterTypes and filterOptions in parallel
      const [filterTypes, filterOptions] = await Promise.all([
        this.filterTypeModel
          .find({ "source.sourceId": componentObjectId, isActive: true })
          .sort({ sortOrder: 1 })
          .lean(),

        this.filterOptionsModel
          .find({ status: EStatus.Active })
          .sort({ sortOrder: 1 })
          .lean(),
      ]);

      if (!filterTypes?.length) {
        return {
          componentId,
          filterTypes: [],
          interactionData: { items: [] },
        };
      }

      // Step 2: Build a Set of valid filterTypeIds
      const filterTypeIds = new Set(filterTypes.map((ft) => ft._id.toString()));

      // Step 3: Group filterOptions by filterTypeId using a Map
      const groupedOptions = new Map<string, any[]>();
      for (const option of filterOptions) {
        const filterTypeId = option.filterTypeId?.toString();
        if (!filterTypeId || !filterTypeIds.has(filterTypeId)) continue;

        if (!groupedOptions.has(filterTypeId)) {
          groupedOptions.set(filterTypeId, []);
        }

        groupedOptions.get(filterTypeId)!.push({
          filterOptionId: option._id.toString(),
          filterType: option.filterType,
          optionKey: option.optionKey,
          optionValue: option.optionValue,
          description: option.description,
          icon: option.icon,
          color: option.color,
          metaData: option.metaData,
        });
      }

      // Step 4: Build interaction items
      const interactionItems = filterTypes.map((ft) => {
        const filterTypeId = ft._id.toString();
        const options = groupedOptions.get(filterTypeId) || [];
        const userValue = filterOption?.[ft.type];

        const mappedOptions = options.map((option) => ({
          ...option,
          isUserSelected: Array.isArray(userValue)
            ? userValue.includes(option.filterOptionId)
            : userValue === option.filterOptionId,
        }));

        return {
          button: {
            type: ft.type,
            lable: ft.displayName,
            selectionType:
              ft.validationRules?.maxSelections > 1 ? "multiple" : "single",
          },
          type: ft.type,
          filterTypeId,
          options: mappedOptions,
        };
      });

      return {
        componentId,
        interactionData: { items: interactionItems },
      };
    } catch (error) {
      throw error;
    }
  }

  private async getTagNameTotalCount(
    serviceItemData: any,
    tagName: string,
    userId: string,
    filterOption: EFilterOption
  ): Promise<number> {
    Sentry.addBreadcrumb({
      message: "getTagNameTotalCount",
      level: "info",
      data: {
        serviceItemData,
        tagName,
        userId,
        filterOption,
      },
    });
    const tagData = serviceItemData?.finalData?.[tagName];
    if (tagData) {
      return tagData.length;
    }

    let page = serviceItemData?.page ?? null;

    if (!page) {
      const [serviceItem] = await this.serviceItemModel
        .find({
          "tag.name": tagName,
          status: Estatus.Active,
          type: EserviceItemType.courses,
        })
        .limit(1)
        .lean();

      if (serviceItem?.skill?.skillId) {
        page = { metaData: { skillId: serviceItem.skill.skillId } };
      }
    }

    if (page) {
      const fullServiceItemData = await this.fetchServiceItemDetails(
        page,
        userId,
        false,
        0,
        0,
        filterOption
      );

      const fullTagData = fullServiceItemData?.finalData?.[tagName];
      if (fullTagData) {
        return fullTagData.length;
      }
    }

    return 0;
  }

  private async updateHeaderActionBarComponent(
    component: any,
    skillType: string,
    userId: string
  ) {
    try {
      let subscriptionData = await this.subscriptionService.validateSubscription(userId, [
        EsubscriptionStatus.initiated,
        EsubscriptionStatus.failed,
      ]);
      let systemConfiguration = await this.systemConfigurationModel.findOne({key:EConfigKeyName.dynamicSearch});
      
      const isNewSubscriber = subscriptionData ? true : false;
      let placeholder;
      if (systemConfiguration) {
        const skillConfig = systemConfiguration.value.find(config => 
          config.skill === skillType
        );
        if (skillConfig) {
          placeholder = `Type '${skillConfig.placeHolder}'`;
        }
      }

        if (component.interactionData && component.interactionData.items) {
          let navigation = await this.systemConfigurationModel.findOne({key:EConfigKeyName.dynamicHeaderNavigation});
          const searchItem = component.interactionData.items.find(item => item.type === EComponentItemType.search);
          if (searchItem && searchItem.metaData) {
            searchItem.metaData.placeholder = placeholder;
          }

          const badgeItem = component.interactionData.items.find(item => item.type === EComponentItemType.badge);
          if (badgeItem) {
            const navConfig = navigation?.value.find(config => config.name === isNewSubscriber);
            if (navConfig) {
              badgeItem.button.lable = navConfig?.lable;
              badgeItem.button.value = navConfig?.type;
              
              if (isNewSubscriber && navConfig.mediaUrl) {
                badgeItem.button.media = [{
                  mediaId:navConfig?.mediaId,
                  type: navConfig?.mediaType,
                  mediaUrl: navConfig.mediaUrl
                }];
              } else {
                badgeItem.button.media = [];
              }
              
              if (navConfig.navigation) {
                badgeItem.navigation = navConfig.navigation;
              }
            }
          }
        }
    } catch (error) {
      throw error;
    }
  }
  async getSuggestionsTag(token: UserToken, skillId: string, skillName: string){
    try {
      Sentry.addBreadcrumb({
        message: "getSuggestionsTag",
        level: "info",
        data: {
          token,
          skillId,
          skillName,
        },
      });
      const suggestionsTag = await this.systemConfigurationModel.findOne({key:EConfigKeyName.suggestionsTag});
      
      const matchedSkill = suggestionsTag.value.tags.find(tag => 
        tag.skillId.toString() === skillId && tag.skillName === skillName
      );
      let data = {
        header : suggestionsTag?.value?.header,
        chips : matchedSkill?.chip,
        media : suggestionsTag?.value?.media,
      }
      return { data };
    } catch (error) {
      throw error;
    }
  }
}

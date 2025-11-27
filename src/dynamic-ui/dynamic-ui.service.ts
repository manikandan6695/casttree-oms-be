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
  EButtonToShow,
  EComponentItemType,
  EComponentKey,
  EComponentType,
  EConfigKeyName,
  EItemType,
  ESysConfigKey,
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
import { UpdatePriorityOrderDto } from "./dto/update-priority-order.dto";

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
        },
      });
      let data = await this.contentPageModel
        .findOne({
          _id: pageId,
          status: EStatus.Active,
        })
        .lean();
      let componentIds = data.components.map((e) => e.componentId);
      const componentDocsPromise = this.componentModel
        .find({
          _id: { $in: componentIds },
          status: EStatus.Active,
          showInLearnPage: true,
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
      const bannerIdPromise = await this.helperService.getBannerToShow(
        token.id,
        skillId,
        skillType,
        EMetabaseUrlLimit.full_size_banner
      );
      const [componentDocsRaw, serviceItemData, bannerResp] =
        await Promise.all([
          componentDocsPromise,
          serviceItemPromise,
          bannerIdPromise,
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
      let viewAllCount = await this.systemConfigurationModel.findOne({key: ESysConfigKey.view_all_count});
      let continueWatching = await this.fetchContinueWatching(
        token.id,
        unquieProcessIds
      );
      let componentDocs = componentDocsRaw;
      let banners = await this.bannerConfigurationModel.find({
        _id: {
          $in: bannerResp?.bannerToShow,
        },
        status: EStatus.Active,
      }).sort({_id: -1});
      // console.log("banners",banners);
      
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
          comp.actionData = comp.actionData.slice(0,viewAllCount?.value?.seriesCount || 5);
          comp["isViewAll"] =
          serviceItemData.finalData[tagName].length >
          (viewAllCount?.value?.viewAllCount ?? 5)
          ? true
          : false;
        }
      });
      for (const comp of componentDocs) {
        if (comp.componentKey === EComponentKey.headerActionBar) {
          await this.updateHeaderActionBarComponent(
            comp,
            skillType,
            skillId,
            token.id
          );
        }
        if (comp.componentKey === EConfigKeyName.learnCategorySection) {
          if (Array.isArray(comp.actionData)) {
            comp.actionData.sort((a, b) => {
              const orderA = typeof a?.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
              const orderB = typeof b?.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            });
            const totalItems = comp.actionData.length;
            if (totalItems > viewAllCount?.value?.learnCategoryCount) {
              comp["isViewAll"] = true;
            }
            comp.actionData = comp.actionData.slice(0, 7);
          }
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
      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.learn_homepage_success;
      mixPanelBody.distinctId = token.id;
      mixPanelBody.properties = {
        category : skillType,
        banner1 : banners[0]?.banner?.name,
        banner2 : banners[1]?.banner?.name,
        banner3 : banners[2]?.banner?.name,
        banner4 : banners[3]?.banner?.name,
        banners : [...new Set(banners.map((banner) => banner.banner?.name))],
      };
      await this.helperService.mixPanel(mixPanelBody);
      const response = { data };
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
        const { allOptionIds } =
          this.extractFilterOptionIds(filterOption);
        if (allOptionIds.length) {
          filter["filterOptionsIds"] = {
            $all: allOptionIds.map(
              (id) => ({
                $elemMatch: { filterOptionId: new ObjectId(id) },
              })
            ),
          };
        }
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
                    priorityOrder: "$priorityOrder",
                    itemId: "$itemId",
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
            // thumbnail: await this.processService.getThumbNail(
            //   pendingProcessInstanceData[i].currentTask?.taskMetaData?.media
            // ),
            title: pendingProcessInstanceData[i].currentTask?.taskTitle,
            ctaName: "Continue",
            progressPercentage: pendingProcessInstanceData[i].completed,
            // navigationURL:
            //   "process/" +
            //   pendingProcessInstanceData[i].processId +
            //   "/task/" +
              // pendingProcessInstanceData[i].currentTask?._id,
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
            role_name: "$category_name",
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
      const proItem = await this.itemModel
        .find({ itemName: "PRO" })
        .select("_id itemName price")
        .lean();
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
        proItem: await this.getProItem(),
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

        const premiumThumbnails = data.premiumThumbnails;
        const paywallThumbnail = data.paywallVideo[0].mediaUrl;
        const paywallVideo = data.paywallVideo[1].mediaUrl;
        const skipText = data.skipText;

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
                  payWallVideo: paywallVideo,
                  payWallThumbnail: paywallThumbnail,
                  premiumThumbnails: premiumThumbnails,
                  paywallVisibility: true,
                },
                skipText: skipText,
                allowMulti: false,
                ...(typeof data.isViewAllEpisode === "boolean"
                  ? { isViewAllEpisode: data.isViewAllEpisode }
                  : {}),
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
              skill: skill.map((item) => ({
                skillId: new ObjectId(item._id),
                skill_name: item.skill_name,
              })),
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
    filterOption: EFilterOption,
    skillId?: string,
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

      const pagination = {
        skip: Math.max(0, Number(query?.skip ?? 0)),
        limit: Math.max(0, Number(query?.limit ?? 0)),
      };

      const [component, pageDocument] = await this.fetchBaseComponents(
        componentId,
        skillId,
      );

      if (!component) {
        throw new NotFoundException("Filter component not found");
      }

      const tagName: string | null = component?.tag?.tagName ?? null;

      if (component?.componentKey === EConfigKeyName.learnCategorySection) {
        const actionItems = Array.isArray(component.actionData)
          ? component.actionData
          : [];
        const endIndex =
          pagination.limit > 0
            ? pagination.skip + pagination.limit
            : undefined;

        component.actionData = actionItems.slice(pagination.skip, endIndex);
        component.totalCount = actionItems.length;

        return { component };
      }

      const componentFilterTypeIds = Array.isArray(component?.filters)
        ? component.filters
            .map((filter: any) =>
              this.normalizeId(filter?.filterTypeId ?? filter),
            )
            .filter((id: string | null): id is string => Boolean(id))
        : [];

      const [serviceItemResult, filterOptionResult] = await Promise.all([
        this.fetchServiceItemData(
          pageDocument,
          token?.id,
          tagName,
          pagination.skip,
          pagination.limit,
          filterOption,
        ),
        this.getComponentFilterOptions(
          componentId,
          token,
          filterOption,
          componentFilterTypeIds,
        ),
      ]);

      const serviceItems = serviceItemResult?.fullData ?? null;
      const paginatedItems = serviceItemResult?.paginatedItems ?? [];
      const interactionItems =
        filterOptionResult?.interactionData?.items ?? [];

      const availableFilterOptionIds = this.getAvailableFilterOptionIds(
        serviceItems,
        tagName ?? "",
        paginatedItems,
      );

      const processedFilterOptions = await this.processFilterOptions(
        interactionItems,
        filterOption,
        availableFilterOptionIds,
      );

      this.updateActualComponentWithFilterData(
        component,
        interactionItems,
        processedFilterOptions,
        paginatedItems,
      );

      const totalCount = await this.calculateTotalCount(
        serviceItems,
        tagName ?? "",
        token?.id ?? "",
        filterOption,
      );

      component.totalCount = totalCount;

      const actionDataResult = await this.resolveComponentActionData({
        serviceItems,
        tagName,
        paginatedItems,
        pageDocument,
        userId: token?.id,
        skip: pagination.skip,
        limit: pagination.limit,
      });

      const hasActionItems = Array.isArray(actionDataResult.items)
        ? actionDataResult.items.length > 0
        : false;

      component.actionData = hasActionItems
        ? actionDataResult.items
        : [];

      if (hasActionItems) {
        if (typeof actionDataResult.totalCountOverride === "number") {
          component.totalCount = actionDataResult.totalCountOverride;
        }
      } else {
        const recommendations = actionDataResult.recommendedItems ?? [];
        component.recommendedList = recommendations;
        component.totalCount = recommendations.length
      }

      return { component };
    } catch (error) {
      throw error;
    }
  }

  private async fetchBaseComponents(componentId: string, skillId?: string) {
    Sentry.addBreadcrumb({
      message: "fetchBaseComponents",
      level: "info",
      data: {
        componentId,
      },
    });
    let filter:any = {
      "components.componentId": componentId,
    }
    if (skillId) {
      filter["metaData.skillId"] = new ObjectId(skillId);
    }
    const [actualComponent, page] = await Promise.all([
      this.componentModel
        .findOne({
          _id: componentId,
          status: EStatus.Active,
        })
        .lean(),
      this.contentPageModel
        .findOne(filter)
        .lean(),
    ]);

    return [actualComponent, page] as [any, any];
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
    let paginatedItems: any[] = [];

    if (page && userId) {
      serviceItemData = await this.fetchServiceItemDetails(
        page,
        userId,
        false,
        0,
        0,
        filterOption,
      );
      if (
        tagName &&
        tagName in (serviceItemData?.finalData ?? {}) &&
        Array.isArray(serviceItemData?.finalData?.[tagName])
      ) {
        const tagItems = serviceItemData.finalData[tagName];
        const endIndex = limit > 0 ? skip + limit : undefined;
        paginatedItems = tagItems.slice(skip, endIndex);
      }
    }

    return { fullData: serviceItemData, paginatedItems };
  }
  private async resolveComponentActionData(params: {
    serviceItems: any;
    tagName: string | null;
    paginatedItems: any[];
    pageDocument: any;
    userId?: string;
    skip: number;
    limit: number;
  }): Promise<{
    items: any[];
    recommendedItems?: any[];
    totalCountOverride?: number;
    source?: "paginated" | "tag" | "recommendation";
  }> {
    const {
      serviceItems,
      tagName,
      paginatedItems,
      pageDocument,
      userId,
      skip,
      limit,
    } = params;
  let serviceItemDetails = await this.fetchServiceItemDetails(
      pageDocument,
      userId,
      false,
      0,
      0,
      null,
    );
    const safePaginatedItems = Array.isArray(paginatedItems)
      ? paginatedItems
      : [];

    if (safePaginatedItems.length > 0) {
      return { items: safePaginatedItems, source: "paginated" };
    }

    if (
      tagName &&
      Array.isArray(serviceItems?.finalData?.[tagName]) &&
      serviceItems.finalData[tagName].length
    ) {
      const tagItems = serviceItems.finalData[tagName];
      const endIndex = limit > 0 ? skip + limit : undefined;
      return {
        items: tagItems.slice(skip, endIndex),
        totalCountOverride: tagItems.length,
        source: "tag",
      };
    }
    const recommendedItems = await this.buildRecommendationList({
      existingServiceItems: serviceItemDetails?.finalData,
      pageDocument,
      userId,
    });

    return {
      items: [],
      recommendedItems,
      totalCountOverride: 0,
      source: "recommendation",
    };
  }

  private async buildRecommendationList(params: {
    existingServiceItems: any;
    pageDocument: any;
    userId?: string;
  }): Promise<any[]> {
    const { existingServiceItems, pageDocument, userId } = params;

    if (!userId) {
      return [];
    }

    try {
      const [completedSeries, serviceItems] = await Promise.all([
        this.loadCompletedSeries(userId),
        this.ensureAllSeriesData(existingServiceItems, pageDocument, userId),
      ]);

      const completedIds = new Set(
        (completedSeries ?? []).map((series: any) =>
          String(series?.processId ?? series?._id ?? ""),
        ),
      );

      const allSeries =
        serviceItems?.finalData?.allSeries && Array.isArray(serviceItems.finalData.allSeries)
          ? serviceItems.finalData.allSeries
          : [];

      return allSeries.filter((series: any) => {
        const processId = String(series?.processId ?? series?._id ?? "");
        return processId && !completedIds.has(processId);
      });
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async loadCompletedSeries(userId: string): Promise<any[]> {
    if (!userId) {
      return [];
    }

    try {
      return await this.processService.getMySeries(
        userId,
        EprocessStatus.Completed,
      );
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async ensureAllSeriesData(
    existingServiceItems: any,
    pageDocument: any,
    userId: string,
  ): Promise<any> {
    if (
      existingServiceItems?.finalData?.allSeries &&
      Array.isArray(existingServiceItems.finalData.allSeries) &&
      existingServiceItems.finalData.allSeries.length
    ) {
      return existingServiceItems;
    }

    if (!pageDocument) {
      return existingServiceItems ?? {};
    }

    try {
      return await this.fetchServiceItemDetails(
        pageDocument,
        userId,
        false,
        0,
        0,
        null,
      );
    } catch (error) {
      Sentry.captureException(error);
      return existingServiceItems ?? {};
    }
  }

  private getAvailableFilterOptionIds(
    serviceItemData: any,
    tagName: string,
    filteredData: any[]
  ): Set<string> {
    const availableIds = new Set<string>();

    const collectFromItem = (item: any) => {
      if (!item || typeof item !== "object") return;

      this.addFilterOptionIdsFromCollection(
        item.filterOptionsIds,
        availableIds
      );
    };

    if (serviceItemData?.finalData) {
      if (tagName && serviceItemData.finalData[tagName]) {
        serviceItemData.finalData[tagName].forEach(collectFromItem);
      } else {
        Object.values(serviceItemData.finalData).forEach((items: any) => {
          if (Array.isArray(items)) {
            items.forEach(collectFromItem);
          }
        });
      }
    }

    if (Array.isArray(filteredData)) {
      filteredData.forEach(collectFromItem);
    }

    return availableIds;
  }

  private addFilterOptionIdsFromCollection(
    collection: any,
    store: Set<string>
  ) {
    if (!collection) return;
    const items = Array.isArray(collection) ? collection : [collection];
    items.forEach((entry) => {
      const id =
        this.normalizeId(entry?.filterOptionId ?? entry?._id ?? entry) ?? null;
      if (id && id.length === 24) {
        store.add(id);
      }
    });
  }

  private normalizeId(id: any): string | null {
    if (!id) return null;
    if (typeof id === "string") return id;
    if (id instanceof ObjectId) return id.toString();
    if (id?.$oid && typeof id.$oid === "string") return id.$oid;
    if (id?._id) return this.normalizeId(id._id);
    if (typeof id === "object" && typeof id.toString === "function") {
      const str = id.toString();
      if (str && str !== "[object Object]") {
        return str;
      }
    }
    return null;
  }

  private normalizeFilterValues(value: any): string[] {
    if (value === undefined || value === null) return [];

    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          items = parsed;
        } else {
          items = [trimmed];
        }
      } catch {
        items = trimmed
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
        if (!items.length) {
          items = [trimmed];
        }
      }
    } else {
      items = [value];
    }

    return items
      .map((entry) => {
        const normalized = this.normalizeId(
          typeof entry === "string" ? entry.trim() : entry
        );
        return normalized && ObjectId.isValid(normalized) && normalized.length === 24
          ? normalized
          : null;
      })
      .filter((id): id is string => Boolean(id));
  }

  private extractFilterOptionIds(
    filterOption?: EFilterOption
  ): { filterOptionMap: Record<string, string[]>; allOptionIds: string[] } {
    const filterOptionMap: Record<string, string[]> = {};
    const allIds = new Set<string>();

    if (!filterOption) {
      return { filterOptionMap, allOptionIds: [] };
    }

    Object.entries(filterOption as Record<string, any>).forEach(
      ([key, value]) => {
        if (value === undefined || value === null) return;
        if (["skip", "limit", "skillId"].includes(key)) return;

        const ids = this.normalizeFilterValues(value);
        if (!ids.length) return;

        filterOptionMap[key] = ids;
        ids.forEach((id) => allIds.add(id));
      }
    );

    return {
      filterOptionMap,
      allOptionIds: Array.from(allIds),
    };
  }

  private async processFilterOptions(
    finalInteractionData: any[],
    filterOption: EFilterOption,
    availableFilterOptionIds: Set<string>
  ) {
    Sentry.addBreadcrumb({
      message: "processFilterOptions",
      level: "info",
      data: {
        finalInteractionData,
        filterOption,
        availableFilterOptionIds: Array.from(
          availableFilterOptionIds ?? []
        ),
      },
    });
    
    const grouped = {};
    const shouldFilter =
      availableFilterOptionIds && availableFilterOptionIds.size > 0;
    let hasAnyFilteredOption = false;

    const registerGroup = (filterType: string, item: any, options: any[]) => {
      grouped[filterType] = {
        type: filterType,
        filterTypeId: item.filterTypeId,
        options: options.map((opt: any) => {
          return {
            filterOptionId: opt?.filterOptionId,
            filterType: opt.filterType || filterType,
            optionKey: opt.optionKey,
            optionValue: opt.optionValue,
            description: opt.description,
            icon: opt.icon,
            color: opt.color,
            metaData: opt.metaData,
            isUserSelected: opt.isUserSelected || false,
          };
        }),
      };
    };

    finalInteractionData.forEach((item: any) => {
      const filterType = item.button?.type || item.type;
      if (!filterType) return;

      const itemOptions = Array.isArray(item.options) ? item.options : [];
      const filteredOptions = itemOptions.filter((opt: any) => {
        const optionId = this.normalizeId(opt?.filterOptionId);
        if (!optionId) {
          return !shouldFilter;
        }
        return !shouldFilter || availableFilterOptionIds.has(optionId);
      });
      if (filteredOptions.length > 0) {
        hasAnyFilteredOption = true;
      }
      registerGroup(filterType, item, filteredOptions);
    });

    if (shouldFilter && !hasAnyFilteredOption) {
      Object.keys(grouped).forEach((key) => delete grouped[key]);
      finalInteractionData.forEach((item: any) => {
        const filterType = item.button?.type || item.type;
        if (!filterType) return;
        const itemOptions = Array.isArray(item.options) ? item.options : [];
        registerGroup(filterType, item, itemOptions);
      });
    }

    this.applyUserSelections(grouped, filterOption);

    return grouped;
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

    const { allOptionIds, filterOptionMap } =
      this.extractFilterOptionIds(filterOption);
    const globalSelection = new Set(allOptionIds);

    Object.values(grouped).forEach((group: any) => {
      group.options.forEach((opt: any) => {
        const optionId = this.normalizeId(opt.filterOptionId);
        opt.isUserSelected = optionId ? globalSelection.has(optionId) : false;
      });
    });

    Object.entries(filterOptionMap).forEach(([filterKey, ids]) => {
      const groupedData = grouped[filterKey];
      if (!groupedData) return;

      const selectedSet = new Set(ids);
      groupedData.options.forEach((opt: any) => {
        const optionId = this.normalizeId(opt.filterOptionId);
        opt.isUserSelected = optionId ? selectedSet.has(optionId) : false;
      });
    });
  }

  private updateActualComponentWithFilterData(
    actualComponent: any,
    finalInteractionData: any[],
    processedFilterOptions: any,
    filteredData: any[]
  ) {
    const hasComponentFilters = Array.isArray(actualComponent?.filters) && actualComponent.filters.length > 0;
    if (actualComponent?.interactionData) {
      if (!hasComponentFilters) {
        actualComponent.interactionData = { items: [] };
      } else {
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

        actualComponent.interactionData = { items: transformedItems };
      }
    } else if (!hasComponentFilters) {
      actualComponent.interactionData = { items: [] };
    }

    actualComponent.actionData = filteredData;
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
  async getComponentFilterOptions(
    componentId: string,
    token?: UserToken,
    filterOption?: EFilterOption,
    filterTypeIdsFromComponent: string[] = []
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

      const normalizedFilterTypeIds = filterTypeIdsFromComponent
        .map((id) => this.normalizeId(id))
        .filter(
          (id): id is string => typeof id === "string" && id.length === 24
        );

      const filterTypeQuery: any = {
        isActive: true,
      };

      if (normalizedFilterTypeIds.length > 0) {
        filterTypeQuery._id = {
          $in: normalizedFilterTypeIds.map((id) => new ObjectId(id)),
        };
      } else {
        filterTypeQuery["source.sourceId"] = componentObjectId;
      }

      // Step 1: Fetch filterTypes and filterOptions in parallel
      let [filterTypes, filterOptions] = await Promise.all([
        this.filterTypeModel
          .find(filterTypeQuery)
          .sort({ sortOrder: 1 })
          .lean(),

        this.filterOptionsModel
          .find({
            status: EStatus.Active,
            ...(normalizedFilterTypeIds.length > 0
              ? {
                  filterTypeId: {
                    $in: normalizedFilterTypeIds.map((id) => new ObjectId(id)),
                  },
                }
              : {}),
          })
          .sort({ sortOrder: 1 })
          .lean(),
      ]);

      if ((!filterTypes || filterTypes.length === 0) && filterOptions.length > 0) {
        const fallbackMap = new Map<
          string,
          {
            _id: string;
            type: string;
            displayName: string;
            sortOrder: number;
          }
        >();

        filterOptions.forEach((option) => {
          const filterTypeId = this.normalizeId(option.filterTypeId);
          if (!filterTypeId) return;
          if (!fallbackMap.has(filterTypeId)) {
            fallbackMap.set(filterTypeId, {
              _id: filterTypeId,
              type: option.filterType || "filterOptionsIds",
              displayName: option.filterType || option.optionKey || "Filter",
              sortOrder: option.sortOrder ?? 0,
            });
          }
        });

        if (fallbackMap.size > 0) {
          filterTypes = Array.from(fallbackMap.values()).sort(
            (a, b) => a.sortOrder - b.sortOrder
          ) as any[];
        }
      }

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

      if (serviceItem?.skill?.some(s => s.skillId)) {
        page = { metaData: { skillId: serviceItem.skill.find(s => s.skillId).skillId } };
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

  async getSeriesList(pageId: string) {
    try {
      Sentry.addBreadcrumb({
        message: "getSeriesList",
        level: "info",
        data: {
          pageId,
        },
      });
      
      const contentPage = await this.contentPageModel.findById(pageId).lean();
      const skillId = contentPage.metaData?.skillId;
      
      const serviceItems = await this.serviceItemModel.aggregate([
        {
          $match: {
            status: Estatus.Active,
            type: EserviceItemType.courses,
            "skill.0.skillId": skillId,
            // $or: [
            //   {
            //     skill: { $type: "object" },
            //     "skill.skillId": skillId,
            //   },
            //   {
            //     skill: { $type: "array" },
            //     "skill.0.skillId": skillId,
            //   },
            // ]
          },
        },
        {
          $project: {
            thumbnail: "$additionalDetails.thumbnail",
            processId: "$additionalDetails.processId",
            priorityOrder: 1,
          },
        },
        {
          $sort: {
            priorityOrder: 1,
          },
        },
      ]);

        return serviceItems;
    } catch (err) {
      throw err;
    }
  }

  async updatePriorityOrder(payload: UpdatePriorityOrderDto[]): Promise<any> {
    try {
      Sentry.addBreadcrumb({
        message: "updatePriorityOrder",
        level: "info",
        data: {
          payload,
        },
      });
      // Build bulk update operations
      const bulkOps = payload.map((item) => ({
        updateOne: {
          filter: { "additionalDetails.processId": item.processId },
          update: { $set: { priorityOrder: item.priorityOrder } },
        },
      }));

      // Execute bulk update
      const result = await this.serviceItemModel.bulkWrite(bulkOps);

      return result;
    } catch (err) {
      throw err;
    }
  }

  private async updateHeaderActionBarComponent(
    component: any,
    skillType: string,
    skillId: string,
    userId: string
  ) {
    try {
      let subscriptionData = await this.subscriptionService.validateSubscription(userId, [
        EsubscriptionStatus.initiated,
        EsubscriptionStatus.failed,
        EsubscriptionStatus.expired,
      ]);
      let systemConfiguration = await this.systemConfigurationModel.findOne({key:EConfigKeyName.dynamicSearch});
      let chipData = await this.systemConfigurationModel.findOne({key:EConfigKeyName.suggestionsTag});
      const userData = await this.helperService.getUserById(userId);
      const countryCode = userData?.data?.country_code;
      const isNewSubscriber = subscriptionData ? true : false;
      let placeholder;
      if (systemConfiguration) {
        const skillConfig = systemConfiguration.value.find(
          (config) => config.skill === skillType
        );
        if (skillConfig) {
          placeholder = `Type `;
        }
      }

      if (component.interactionData && component.interactionData.items) {
        let navigation = await this.systemConfigurationModel.findOne({
          key: EConfigKeyName.dynamicHeaderNavigation,
        });
        const searchItem = component.interactionData.items.find(
          (item) => item.type === EComponentItemType.search
        );
        if (searchItem && searchItem.metaData) {
          searchItem.metaData.placeholder = placeholder;

          const matchedSkill = chipData.value.tags.find(
            (tag) => tag.skillName === skillType
          );
          if (matchedSkill && matchedSkill.chip) {
            searchItem.actionData = matchedSkill.chip;
          }
        }

          const badgeItem = component.interactionData.items.find(item => item.type === EComponentItemType.badge);
          if (badgeItem) {
            let buttonToShow = isNewSubscriber ? EButtonToShow.referral : EButtonToShow.pro;
            const navConfig = navigation?.value.find(config => config.key === buttonToShow);
            if (navConfig) {
              badgeItem.button.label = navConfig?.label;
              badgeItem.button.value = navConfig?.type;
              badgeItem.button.media = [{
                mediaId:navConfig?.mediaId,
                type: navConfig?.mediaType,
                mediaUrl: navConfig?.mediaUrl
              }];              
              
              if (navConfig.navigation ) {
                badgeItem.navigation = { ...navConfig.navigation };
                
                if (countryCode !== "IN" && isNewSubscriber === false ) {
                  badgeItem.navigation.page = navConfig?.navigation?.iapPage;
                  badgeItem.navigation.isEnableBottomSheet = false;
                }
                
                if (!isNewSubscriber) {
                let itemData = await this.serviceItemModel.findOne({
                  status: EStatus.Active,
                  "skill.skill_name": skillType,
                  "skill.skillId": new ObjectId(skillId),
                  type: EserviceItemType.courses,
                }).select("planItemId").sort({_id: -1}).lean();
                if (itemData) {
                  badgeItem.navigation.params.planItemId = itemData?.planItemId[0]?.itemId;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async getSuggestionsTag(
    token: UserToken,
    skillId: string,
    skillName: string
  ) {
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
      const suggestionsTag = await this.systemConfigurationModel.findOne({
        key: EConfigKeyName.suggestionsTag,
      });

      const matchedSkill = suggestionsTag.value.tags.find(
        (tag) =>
          tag.skillId.toString() === skillId && tag.skillName === skillName
      );
      let data = {
        header : suggestionsTag?.value?.header,
        chips : matchedSkill?.chip,
        media : matchedSkill?.media,
      }
      return { data };
    } catch (error) {
      throw error;
    }
  }

  async getComponentFilter(
    token: UserToken,
    componentId: string,
    skip: number,
    limit: number,
    filterOption?: EFilterOption,
    skillId?: string
  ) {
    try {
      Sentry.addBreadcrumb({
        message: "getComponentFilter",
        level: "info",
        data: {
          token,
          componentId,
          skip,
          limit,
          filterOption,
        },
      });
      const component = await this.componentModel
        .findOne({
          _id: new ObjectId(componentId),
          status: EStatus.Active,
          showInLearnPage: true
        })
        .lean();
      if (!component) {
        throw new NotFoundException("Component not found");
      }
      if (component?.componentKey === EConfigKeyName.learnCategorySection) {

        const actionItems = Array.isArray(component?.actionData)
          ? component?.actionData
          : [];
        
        const sortedActionItems = actionItems.sort((a, b) => {
          const orderA = a?.order ?? 0;
          const orderB = b?.order ?? 0;
          return orderA - orderB;
        });
        
        const endIndex = limit > 0 ? skip + limit : sortedActionItems.length;

        component.actionData = sortedActionItems.slice(skip, endIndex);
        component["totalCount"] = sortedActionItems.length;
        return { component };
      }
      const tagName = component?.tag?.tagName;
      let page = await this.contentPageModel
          .findOne({
            "components.componentId": new ObjectId(componentId),
            status: EStatus.Active,
          })
          .lean();
      const componentFilters = Array.isArray((component as any)?.filters)
        ? (component as any).filters
        : [];
      
      const hasFilters = componentFilters.length > 0;

      let interactionDataItems: any[] = [];
      if (hasFilters) { 
        const sortedFilters = [...componentFilters].sort((a, b) => {
          const orderA = a?.order ?? 0;
          const orderB = b?.order ?? 0;
          return orderA - orderB;
        });

        const filterTypeIds = sortedFilters
          .map((filter) => this.normalizeId(filter?.filterTypeId ?? filter))
          .filter((id): id is string => Boolean(id) && id.length === 24);
        if (filterTypeIds.length > 0) {
          const [filterTypes, filterOptions] = await Promise.all([
            this.filterTypeModel
              .find({
                _id: { $in: filterTypeIds.map((id) => new ObjectId(id)) },
                isActive: true,
              })
              .sort({ sortOrder: 1 })
              .lean(),
            this.filterOptionsModel
              .find({
                filterTypeId: {
                  $in: filterTypeIds.map((id) => new ObjectId(id)),
                },
                status: EStatus.Active,
              })
              .sort({ sortOrder: 1 })
              .lean(),
          ]);
          const groupedOptions = new Map<string, any[]>();
          filterOptions.forEach((option) => {
            const filterTypeId = option.filterTypeId?.toString();
            if (!filterTypeId) return;
            if (!groupedOptions.has(filterTypeId)) {
              groupedOptions.set(filterTypeId, []);
            }
            groupedOptions.get(filterTypeId)!.push({
              filterOptionId: option?._id?.toString(),
              filterType: option?.filterType,
              optionKey: option?.optionKey,
              optionValue: option?.optionValue,
              isUserSelected: false,
            });
          });
          interactionDataItems = sortedFilters
            .map((filter) => {
              const filterTypeId = this.normalizeId(
                filter?.filterTypeId ?? filter
              );
              if (!filterTypeId) return null;

              const filterType = filterTypes.find(
                (ft) => ft._id.toString() === filterTypeId
              );
              if (!filterType) return null;

              const options = groupedOptions.get(filterTypeId) || [];
              
              const userValue = filterOption?.[filterType?.type];
              const mappedOptions = options.map((option) => ({
                ...option,
                isUserSelected: Array.isArray(userValue)
                  ? userValue.includes(option?.filterOptionId)
                  : userValue === option?.filterOptionId,
              }));

              const selectionType =
                filterType?.validationRules?.maxSelections > 1
                  ? "multiple"
                  : "single";

              return {
                button: {
                  type: filterType?.type,
                  lable: filterType?.displayName,
                  selectionType: selectionType,
                },
                type: filterType?.type,
                filterTypeId: filterTypeId,
                options: mappedOptions,
              };
            })
            .filter((item): item is any => item !== null);
        }
      }
      let serviceItemData = null;
      if (page) {
        serviceItemData = await this.fetchServiceItemDetails(
          page,
          token.id,
          false,
          0,
          0,
          filterOption
        );
      }
      let actionData: any[] = [];
      let totalCount = 0;
      let recommendedList: any[] = [];
      if (serviceItemData?.finalData) {
        if (tagName && serviceItemData?.finalData[tagName]) {
          actionData = serviceItemData?.finalData[tagName];
          totalCount = actionData.length;
        } else {
          actionData = Object.values(serviceItemData?.finalData).flat() as any[];
          totalCount = actionData.length;
        }
      }
      if (filterOption && actionData.length === 0) {
        if (serviceItemData?.finalData?.allSeries) {
          recommendedList = serviceItemData?.finalData?.allSeries;
        } else if (page && token?.id) {
          const allSeriesData = await this.fetchServiceItemDetails(
            page,
            token.id,
            false,
            0,
            0,
            null
          );
          if (allSeriesData?.finalData?.allSeries) {
            recommendedList = allSeriesData?.finalData?.allSeries;
          }
        }
      }
      const paginatedActionData = actionData.slice(skip, skip + limit);
      const finalTotalCount = actionData.length > 0 ? totalCount : recommendedList.length;
      const response: any = {
        component: {
          ...component,
          interactionData: {
            items: hasFilters ? interactionDataItems : [],
          },
          actionData: paginatedActionData,
          totalCount: finalTotalCount,
        },
      };
      if (actionData.length === 0 && recommendedList.length > 0) {
        response.component.recommendedList = recommendedList;
      }

      return response;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
  async getCourseSeriesCardDetails(
    pageId: string,
    skip: number,
    limit: number
  ): Promise<{ data: any[]; count: number }> {
    try {
      const paginationSkip = Math.max(0, Number(skip) || 0);
      const paginationLimit = Math.max(0, Number(limit) || 0);
  
      Sentry.addBreadcrumb({
        message: "getCourseSeriesCardDetails",
        level: "info",
        data: { pageId, skip: paginationSkip, limit: paginationLimit },
      });
  
      const page = await this.contentPageModel
        .findOne({
          _id: new ObjectId(pageId),
          status: EStatus.Active,
        })
        .lean();
  
      if (!page?.metaData?.skillId) return { data: [], count: 0 };
  
      const componentIds = page?.components
        ?.map((c) => this.normalizeId(c?.componentId))
        .filter((id) => id && ObjectId.isValid(id))
        .map((id) => new ObjectId(id)) ?? [];
  
      if (!componentIds.length) return { data: [], count: 0 };
  
      const skillId = new ObjectId(page?.metaData?.skillId);
  
      // Use aggregation pipeline to get components and extract tags
      const componentsWithTags = await this.componentModel.aggregate([
        {
          $match: {
            _id: { $in: componentIds },
            status: EStatus.Active,
            componentKey: "course-series-card",
            title: { $ne: "All Series" },
          },
        },
        { $sort: { order: 1 } },
        {
          $project: {
            _id: 1,
            componentKey: 1,
            type: 1,
            title: 1,
            order: 1,
            media: 1,
            navigation: 1,
            tag: 1,
            status: 1,
            updated_at: 1,
            metaData: 1,
            tagName: 1,
          },
        },
      ]);
  
      if (!componentsWithTags.length) return { data: [], count: 0 };
  
      // Extract tags from components (keeping the complex JS logic)
      const allTags = new Set<string>();
      const componentTagMap = new Map<string, string[]>();
  
      for (const component of componentsWithTags) {
        const compId = this.normalizeId(component?._id);
        const tags = this.getComponentTags(component, page?.metaData, compId);
  
        if (tags.length) {
          componentTagMap.set(compId, tags);
          tags.forEach((tagName) => allTags.add(tagName));
        }
      }
  
      if (!allTags.size) return { data: [], count: 0 };
  
      const enrichedServiceItems = await this.serviceItemModel.aggregate([
        {
          $match: {
            type: EserviceItemType.courses,
            "skill.skillId": skillId,
            "tag.name": { $in: [...allTags] },
            status: Estatus.Active,
          },
        },
        {
          $project: {
            _id: 1,
            itemId: 1,
            userId: 1,
            skill: 1,
            tag: 1,
            role: 1,
            additionalDetails: 1,
            filterOptionsIds: 1,
            processId: { $toString: "$additionalDetails.processId" },
            processIdObj: "$additionalDetails.processId",
          },
        },
        // Lookup first task for each process
        {
          $lookup: {
            from: "task",
            let: { procId: "$processIdObj" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$processId", "$$procId"] },
                      { $eq: ["$status", Estatus.Active] },
                    ],
                  },
                },
              },
              { $sort: { taskNumber: 1 } },
              { $limit: 1 },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  isLocked: 1,
                  taskMetaData: 1,
                  processId: 1,
                },
              },
            ],
            as: "firstTask",
          },
        },
        {
          $unwind: {
            path: "$firstTask",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup item details
        {
          $lookup: {
            from: "item",
            localField: "itemId",
            foreignField: "_id",
            as: "itemData",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  itemName: 1,
                  itemDescription: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$itemData",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup expert profile
        {
          $lookup: {
            from: "profile",
            let: { userId: "$userId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", "$$userId"] },
                      { $eq: ["$type", EprofileType.Expert] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "media",
                  localField: "media.media_id",
                  foreignField: "_id",
                  as: "mediaData",
                },
              },
              {
                $project: {
                  userId: 1,
                  displayName: 1,
                  about: 1,
                  about2: 1,
                  media: {
                    $map: {
                      input: "$mediaData",
                      as: "m",
                      in: {
                        mediaId: { $toString: "$$m._id" },
                        mediaUrl: "$$m.location",
                        mediaType: "$$m.media_type",
                      },
                    },
                  },
                },
              },
            ],
            as: "expertProfile",
          },
        },
        {
          $unwind: {
            path: "$expertProfile",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup filter options
        {
          $lookup: {
            from: "filterOptions",
            let: {
              filterOptionIds: {
                $map: {
                  input: { $ifNull: ["$filterOptionsIds", []] },
                  as: "fo",
                  in: {
                    $cond: {
                      if: { $eq: [{ $type: "$$fo.filterOptionId" }, "objectId"] },
                      then: "$$fo.filterOptionId",
                      else: {
                        $cond: {
                          if: { $ne: ["$$fo.filterOptionId._id", null] },
                          then: "$$fo.filterOptionId._id",
                          else: {
                            $cond: {
                              if: { $ne: ["$$fo.filterOptionId", null] },
                              then: "$$fo.filterOptionId",
                              else: "$$fo",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$filterOptionIds"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  optionValue: 1,
                },
              },
            ],
            as: "filterOptionsData",
          },
        },
        // Build actionData structure
        {
          $project: {
            processId: 1,
            tag: 1,
            actionData: {
              thumbnail: "$additionalDetails.thumbnail",
              itemName: { $ifNull: ["$itemData.itemName", ""] },
              processId: "$processId",
              taskId: {
                $cond: {
                  if: { $ne: ["$firstTask._id", null] },
                  then: { $toString: "$firstTask._id" },
                  else: null,
                },
              },
              taskDetail: {
                $cond: {
                  if: { $ne: ["$firstTask._id", null] },
                  then: {
                    media: { $ifNull: ["$firstTask.taskMetaData.media", []] },
                    shareText: { $ifNull: ["$firstTask.taskMetaData.shareText", ""] },
                  },
                  else: {},
                },
              },
              title: { $ifNull: ["$firstTask.title", ""] },
              isLocked: { $ifNull: ["$firstTask.isLocked", false] },
              itemDesc: { $ifNull: ["$itemData.itemDescription", ""] },
              tag: { $ifNull: ["$tag", []] },
              skill: { $ifNull: ["$skill", []] },
              role: { $ifNull: ["$role", []] },
              userId: {
                $cond: {
                  if: { $ne: ["$userId", null] },
                  then: { $toString: "$userId" },
                  else: null,
                },
              },
              expertProfile: {
                $cond: {
                  if: { $ne: ["$expertProfile", null] },
                  then: {
                    displayName: "$expertProfile.displayName",
                    about: "$expertProfile.about",
                    about2: "$expertProfile.about2",
                    media: { $ifNull: ["$expertProfile.media", []] },
                  },
                  else: {},
                },
              },
              filterOptionsIds: {
                $map: {
                  input: { $ifNull: ["$filterOptionsIds", []] },
                  as: "fo",
                  in: {
                    $let: {
                      vars: {
                        filterOptionId: {
                          $cond: {
                            if: { $eq: [{ $type: "$$fo.filterOptionId" }, "objectId"] },
                            then: { $toString: "$$fo.filterOptionId" },
                            else: {
                              $cond: {
                                if: { $ne: ["$$fo.filterOptionId._id", null] },
                                then: { $toString: "$$fo.filterOptionId._id" },
                                else: {
                                  $cond: {
                                    if: { $ne: ["$$fo.filterOptionId", null] },
                                    then: {
                                      $cond: {
                                        if: { $eq: [{ $type: "$$fo.filterOptionId" }, "objectId"] },
                                        then: { $toString: "$$fo.filterOptionId" },
                                        else: "$$fo.filterOptionId",
                                      },
                                    },
                                    else: { $toString: "$$fo" },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      in: {
                        $let: {
                          vars: {
                            matchedFilter: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$filterOptionsData",
                                    as: "fod",
                                    cond: {
                                      $eq: [
                                        { $toString: "$$fod._id" },
                                        "$$filterOptionId",
                                      ],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            $cond: {
                              if: { $ne: ["$$matchedFilter", null] },
                              then: {
                                filterOptionId: "$$filterOptionId",
                                optionValue: "$$matchedFilter.optionValue",
                              },
                              else: null,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            processId: 1,
            tag: 1,
            actionData: {
              $mergeObjects: [
                "$actionData",
                {
                  filterOptionsIds: {
                    $filter: {
                      input: "$actionData.filterOptionsIds",
                      as: "fo",
                      cond: { $ne: ["$$fo", null] },
                    },
                  },
                },
              ],
            },
          },
        },
      ]);
  
      if (!enrichedServiceItems.length) return { data: [], count: 0 };
  
      // Build tag to processId mapping
      const tagProcessMap = new Map<string, Set<string>>();
      const actionDataMap = new Map<string, any>();
  
      for (const item of enrichedServiceItems) {
        const pid = item.processId;
        if (!pid) continue;
  
        actionDataMap.set(pid, item.actionData);
  
        (item.tag || []).forEach((tag: any) => {
          const tagName = tag?.name;
          if (tagName) {
            if (!tagProcessMap.has(tagName)) tagProcessMap.set(tagName, new Set());
            tagProcessMap.get(tagName)?.add(pid);
          }
        });
      }
  
      // Build final component data
      const finalData = componentsWithTags
        .map((comp) => {
          const compId = this.normalizeId(comp?._id);
          const tags = componentTagMap.get(compId) || [];
  
          const processIds = new Set<string>();
          tags.forEach((tagName) => {
            const pidSet = tagProcessMap.get(tagName);
            if (pidSet) pidSet.forEach((processId) => processIds.add(processId));
          });
  
          if (!processIds.size) return null;
  
          return {
            componentKey: comp.componentKey,
            type: comp.type,
            title: comp?.title || "",
            order: comp?.order,
            actionData: [...processIds].map((id) => actionDataMap.get(id)).filter(Boolean),
            media: comp?.media || [],
            navigation: comp?.navigation || {},
            tag: comp?.tag || [],
            status: comp?.status,
            updated_at: comp?.updated_at,
          };
        })
        .filter(Boolean);
  
      const filtered = finalData.filter((item) => item && item.actionData.length > 0);
      const paginated =
        paginationLimit > 0
          ? filtered.slice(paginationSkip, paginationSkip + paginationLimit)
          : filtered.slice(paginationSkip);
  
      return { data: paginated, count: filtered.length };
    } catch (err) {
      Sentry.captureException(err);
      throw err;
    }
  }

  private getComponentTags(component: any, pageMetaData: any, componentId: string): string[] {
    const extractTags = (value: any): string[] =>
      !value ? [] :
      typeof value === "string" ? [value] :
      Array.isArray(value) ? value.flatMap(extractTags) :
      typeof value === "object"
        ? [value?.name, value?.tagName].filter(Boolean).concat(extractTags(value?.tag), extractTags(value?.tags))
        : [];
  
    const componentTags = [
      component?.tag,
      component?.metaData?.tag,
      component?.metaData?.tags,
      component?.tagName
    ].flatMap(extractTags);
  
    const matchedMetaComponent = pageMetaData?.components?.find?.((meta: any) =>
      this.normalizeId(meta?.componentId || meta?.component_id || meta?.id || meta?._id) === componentId
    );
  
    const metaTags = matchedMetaComponent
      ? [matchedMetaComponent?.tag, matchedMetaComponent?.tags, matchedMetaComponent?.tagName, matchedMetaComponent?.tagNames].flatMap(extractTags)
      : [];
  
    return [...new Set([...componentTags, ...metaTags])];
  }

}

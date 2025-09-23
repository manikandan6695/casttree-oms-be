import { SubscriptionService } from "src/subscription/subscription.service";
import { EprocessStatus, EStatus } from "./../process/enums/process.enum";
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
import {
  EMixedPanelEvents,
  EMetabaseUrlLimit,
} from "src/helper/enums/mixedPanel.enums";
import { log } from "console";
import { ENavBar } from "./enum/nav-bar.enum";
import { EComponentKey, EComponentType } from "./enum/component.enum";
import { EFilterOption } from "./dto/filter-option.dto";
import { IFilterType } from "./schema/filter-type.schema";
import { IFilterOption } from "./schema/filter-option.schema";
import { EUpdateComponents } from "./dto/update-components.dto";
import { EUpdateSeriesTag } from "./dto/update-series-tag.dto";
const { ObjectId } = require("mongodb");
import { ICategory } from "./schema/category.schema";
import { IBannerConfiguration } from "./schema/banner-configuration.schema";
import { RedisService } from "src/redis/redis.service";

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
    private subscriptionService: SubscriptionService,
    @InjectModel("filterTypes")
    private readonly filterTypeModel: Model<IFilterType>,
    @InjectModel("filterOptions")
    private readonly filterOptionsModel: Model<IFilterOption>,
    @InjectModel("category")
    private readonly categoryModel: Model<ICategory>,
    @InjectModel("bannerConfiguration")
    private readonly bannerConfigurationModel: Model<IBannerConfiguration>,
    private readonly redisService: RedisService
  ) {}
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

  async getPageDetails(
    token: UserToken,
    pageId: string,
    skip: number | undefined,
    limit: number | undefined,
    filterOption: EFilterOption
  ) {
    try {
      // Cache key composed of user, page, pagination, and filters
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
      if (filterOption) {
        Object.keys(filterOption).forEach((filterKey) => {
          const filterValue = filterOption[filterKey];

          if (filterValue) {
            if (Array.isArray(filterValue)) {
              const validIds = filterValue.filter(
                (id) => id && typeof id === "string" && id.length === 24
              );
              if (validIds.length > 0) {
                filter[`${filterKey}.filterOptionId`] = {
                  $in: validIds.map((id) => new ObjectId(id)),
                };
              }
            } else {
              if (
                filterValue &&
                typeof filterValue === "string" &&
                filterValue.length === 24
              ) {
                filter[`${filterKey}.filterOptionId`] = new ObjectId(
                  filterValue
                );
              }
            }
          }
        });
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

  async fetchUserPreferenceBanner(
    isNewSubscription: boolean,
    userId: string,
    userProcessedSeries,
    components,
    countryCode: string,
    isSubscriber: boolean
  ) {
    try {
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

  async componentFilterOptions() {
    try {
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
      const { tag, selected: series, componentId, unselected } = data;
      const compId = new ObjectId(componentId);

      // First, find the category document by category_name
      const categoryDoc = await this.categoryModel
        .findOne({
          category_name: tag,
          status: "Active",
        })
        .lean();

      if (!categoryDoc) {
        throw new Error(`Category with name '${tag}' not found or not active`);
      }

      const categoryId = categoryDoc._id;
      console.log("categoryId", categoryId);

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
  async getPageDetail(
    token: UserToken,
    pageId: string,
    skip: number | undefined,
    limit: number | undefined,
    filterOption: EFilterOption
  ) {
    try {
      // Cache key composed of user, page, pagination, and filters
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
}

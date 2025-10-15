import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FilterPlatformItemDTO } from "./dto/filter-platformItem.dto";
import { IItemModel } from "./schema/item.schema";
import { IPlatformItemModel } from "./schema/platform-item.schema";
import { HelperService } from "src/helper/helper.service";
import { EStatus } from "src/service-request/enum/service-request.enum";
import { IFilterOption } from "src/dynamic-ui/schema/filter-option.schema";
import { ObjectId } from "mongodb";

@Injectable()
export class ItemService {
  constructor(
    @InjectModel("platformItem")
    private platformItem: Model<IPlatformItemModel>,
    private helperService: HelperService,
    @InjectModel("item") private itemModel: Model<IItemModel>,
    @InjectModel("filterOptions")
    private filterOptionModel: Model<IFilterOption>
  ) {}
  async getPlatformItem(
    query: FilterPlatformItemDTO,
    skip: number,
    limit: number
  ) {
    try {
      let filter = {};
      if (query.itemName) {
        filter = { itemName: query.itemName };
      }
      let data = await this.platformItem
        .find(filter, { _id: 0, itemName: 1 })
        .sort({ itemName: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      let countData = await this.platformItem.countDocuments(filter);
      return { data: data, count: countData };
    } catch (err) {
      throw err;
    }
  }

  async getItemsDetails(ids) {
    try {
      let data = await this.itemModel.find({ _id: { $in: ids } }).lean();
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getItemDetail(id: string, version?: string) {
    try {
      const data = await this.itemModel.findOne({ _id: new ObjectId(id) }).lean();
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getItem(
    id: string,
    skip: number,
    limit: number,
    apiVersion: string,
    accessToken?: string
  ) {
    try {
      // console.log("accessToken is", accessToken);

      if (apiVersion === "2") {
        const itemData = await this.itemModel.findOne({ _id: id }).lean();
        const awardData = await this.helperService.getAward(id);
        const application = await this.helperService.getUserApplication(
          awardData?._id,
          accessToken
        );

        const isSubmitted =
          new Date() >=
            new Date(itemData?.additionalDetail?.registrationExpiry) ||
          !!application;
        return {
          item: itemData,
          award: awardData,
          isSubmitted: isSubmitted,
        };
      } else if (apiVersion === "3") {
        const itemData = await this.itemModel.findOne({ _id: id }).lean();
        const awardData = await this.helperService.getAward(id);
        const awardId = awardData?._id;
        const nominationsData = await this.helperService.getNominations(
          awardId,
          skip || 0,
          limit || 600
        );
        const application = await this.helperService.getUserApplication(
          awardData?._id,
          accessToken
        );

        if (itemData?.additionalDetail?.allowMulti) {
          itemData.additionalDetail.allowMulti = new Date() <= new Date(itemData.additionalDetail.registrationExpiry);
        }
        const isSubmitted =
          new Date() >=
            new Date(itemData?.additionalDetail?.registrationExpiry) ||
          !!application;
        // Fetch additional filters if filterTypeId exists in additionalDetail
        let additionalFilters = null;
        if (itemData?.additionalDetail?.filterTypeId) {
          try {
            additionalFilters = await this.filterOptionModel
              .find({
                filterTypeId: new Types.ObjectId(
                  itemData?.additionalDetail?.filterTypeId
                ),
                status: EStatus.Active,
              })
              .sort({ sortOrder: 1 })
              .lean();
          } catch (error) {
            console.log("Error fetching filter options:", error);
            additionalFilters = null;
          }
        }

        return {
          item: itemData,
          award: awardData,
          participants: nominationsData,
          filterOptions: additionalFilters,
          isSubmitted: isSubmitted,
        };
      } else {
        const itemData = await this.itemModel.findOne({ _id: id }).lean();
        const awardData = await this.helperService.getAward(id);
        const awardId = awardData?._id;
        const nominationsData = await this.helperService.getNominations(
          awardId,
          skip || 0,
          limit || 600
        );
        return {
          item: itemData,
          award: awardData,
          participants: nominationsData,
        };
      }
    } catch (err) {
      throw err;
    }
  }
  async getItemDetailByName(name: string) {
    try {
      let data = await this.itemModel.findOne({ itemName: name }).lean();
      return data;
    } catch (err) {
      throw err;
    }
  }
  async getItemNamesByIds(itemIds: string[]) {
    try {
      const items = await this.itemModel
        .find({ _id: { $in: itemIds } }, { _id: 1, itemName: 1 })
        .lean();
      return items.reduce((acc, item) => {
        acc[item._id.toString()] = item.itemName;
        return acc;
      }, {});
    } catch (err) {
      throw err;
    }
  }
  async getParentItemId(parentId: string) {
    try {
      let filter: any = {};
      if (parentId) {
        filter.parentItemId = new Types.ObjectId(parentId);
      }
      let itemData = await this.itemModel.find(filter).lean();
      return { itemData };
    } catch (error) {
      throw error;
    }
  }
  async getItemByPlanConfig(planConfig: string, provider: any) {
    try {
      let providerId = parseInt(provider);
      let data = await this.itemModel
        .findOne({
          status: EStatus.Active,
          "additionalDetail.planConfig": {
            $elemMatch: {
              planId: planConfig,
              providerId: providerId,
            },
          },
        })
        .lean();
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getItemByItemName(itemName: string) {
    try {
      const data = await this.itemModel.findOne({ itemName: itemName }).lean();
      return data;
    } catch (err) {
      throw err;
    }
  }
  async getGroupedItemDetail(itemId: string) {
    try {
      const result = await this.itemModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(itemId)
          }
        },
        {
          $lookup: {
            from: 'item',
            let: { groupId: '$itemGroupId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$itemGroupId', '$$groupId'] },
                      { $eq: ['$additionalDetail.subscriptiontype', 'yearly'] }
                    ]
                  }
                }
              },
              {
                $project: {
                  _id: 1,
                  learnBottomSheet: '$additionalDetail.learnBottomSheet'
                }
              },
              {
                $limit: 1
              }
            ],
            as: 'groupedItems'
          }
        },
        {
          $project: {
            itemId: { $arrayElemAt: ['$groupedItems._id', 0] },
            learnBottomSheet: { $arrayElemAt: ['$groupedItems.learnBottomSheet', 0] }
          }
        }
      ]);
      return {
        itemId: result[0].itemId,
        learnBottomSheet: result[0].learnBottomSheet
      };
    }
    catch(error){
      throw error;
    }
  }
}

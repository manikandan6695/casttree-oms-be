import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FilterPlatformItemDTO } from "./dto/filter-platformItem.dto";
import { IItemModel } from "./schema/item.schema";
import { IPlatformItemModel } from "./schema/platform-item.schema";
import { HelperService } from "src/helper/helper.service";

@Injectable()
export class ItemService {
  constructor(
    @InjectModel("platformItem")
    private platformItem: Model<IPlatformItemModel>,
    private helperService: HelperService,
    @InjectModel("item") private itemModel: Model<IItemModel>
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
      const data = await this.itemModel.findOne({ _id: id }).lean();
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getItem(id: string) {
    try {
      const itemData = await this.itemModel.findOne({ _id: id }).lean();
      const awardData = await this.helperService.getAward(id);
      const awardId = awardData?._id;
      const nominationsData = await this.helperService.getNominations(awardId);
      return {
        item: itemData,
        award: awardData,
        participants: nominationsData,
      };
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
}

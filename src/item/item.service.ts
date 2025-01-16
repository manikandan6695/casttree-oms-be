import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IPlatformItemModel } from "./schema/platform-item.schema";
import { FilterPlatformItemDTO } from "./dto/filter-platformItem.dto";
import { IItemModel } from "./schema/item.schema";

@Injectable()
export class ItemService {
  constructor(
    @InjectModel("platformItem")
    private platformItem: Model<IPlatformItemModel>,
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

  async getItemDetail(id: string) {
    try {
      let data = await this.itemModel.findOne({ _id: id });
      return data;
    } catch (err) {
      throw err;
    }
  }
}

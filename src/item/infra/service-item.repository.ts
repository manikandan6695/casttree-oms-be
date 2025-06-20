import { IServiceItemRepository } from "./interface/iservice-item.repository";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { serviceitems } from "src/item/infrastructure/entity/serviceItem.schema";

@Injectable()
export class ServiceItemRepository implements IServiceItemRepository {
  constructor(
    @InjectModel("serviceitems") private serviceItemModel: Model<serviceitems>
  ) {}

  async findById(itemId: string): Promise<any> {
    try {
      return await this.serviceItemModel
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
    } catch (err) {
      throw err;
    }
  }

  async findByProcessId(
    processId: string | string[],
    userId?: string
  ): Promise<any> {
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
        // Note: profileInfo, userProfileInfo, firstTasks, etc. should be handled in the handler if needed
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

  async findAll(
    query: any,
    skip: number,
    limit: number,
    countryCode?: string
  ): Promise<any[]> {
    try {
      const filter: any = {};
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
      if (query.type) {
        filter["type"] = query.type;
      }
      filter["status"] = query.status || "Active";
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
      // countryCode logic (price update) should be handled in the handler if needed
      return serviceItemData;
    } catch (err) {
      throw err;
    }
  }

  async create(data: any): Promise<any> {
    try {
      const created = new this.serviceItemModel(data);
      return await created.save();
    } catch (err) {
      throw err;
    }
  }

  async delete(id: string): Promise<any> {
    try {
      return await this.serviceItemModel.findByIdAndDelete(id).lean();
    } catch (err) {
      throw err;
    }
  }

  async update(id: string, update: any): Promise<any> {
    try {
      return await this.serviceItemModel
        .findByIdAndUpdate(id, update, { new: true })
        .lean();
    } catch (err) {
      throw err;
    }
  }

  async findDetails(
    id: string,
    countryCode?: string,
    userId?: string
  ): Promise<any> {
    return Promise.resolve(null);
  }

  async findWorkshopItems(
    filter: any,
    skip: number,
    limit: number,
    userId?: string,
    countryCode?: string
  ): Promise<any> {
    return Promise.resolve([]);
  }

  async findWorkshopItemDetails(
    id: string,
    userId?: string,
    countryCode?: string
  ): Promise<any> {
    return Promise.resolve(null);
  }

  async findProcessHomeScreenData(userId: string): Promise<any> {
    return Promise.resolve([]);
  }

  async findCourseHomeScreenData(userId: string): Promise<any> {
    return Promise.resolve([]);
  }

  async findPlanDetails(
    processId: string,
    countryCode?: string,
    userId?: string
  ): Promise<any> {
    return Promise.resolve(null);
  }

  async findPromotionDetails(
    processId: string,
    countryCode?: string,
    userId?: string
  ): Promise<any> {
    return Promise.resolve(null);
  }

  async findPremiumDetails(
    countryCode?: string,
    userId?: string
  ): Promise<any> {
    return Promise.resolve(null);
  }

  async findSubscriptionPlanDetails(
    countryCode?: string,
    userId?: string
  ): Promise<any> {
    return Promise.resolve(null);
  }

  async findMentorUserIds(processIds: string[] | string): Promise<any> {
    return Promise.resolve([]);
  }

  async findUpdatePrice(countryCode: string, itemIds: string[]): Promise<any> {
    return Promise.resolve([]);
  }

  async findServiceItemType(itemId: string): Promise<any> {
    return Promise.resolve(null);
  }

  async findByFilter(filter: any): Promise<any> {
    return Promise.resolve([]);
  }

  async findServiceDueDate(itemId: string, userId: string): Promise<any> {
    return Promise.resolve(null);
  }

  async findLanguages(itemId: string): Promise<any> {
    return Promise.resolve([]);
  }

  async findPriceListItems(
    itemIds: string[],
    countryCode: string
  ): Promise<any> {
    return Promise.resolve([]);
  }
}

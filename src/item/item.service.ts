import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { serviceItem } from './schema/serviceIte.schema';
import { FilterItemRequestDTO } from './dto/filter-item.dto';

@Injectable()
export class ItemService {
     constructor(
        @InjectModel("serviceItem") private serviceItemModel: Model<serviceItem>,
    ){}
    async getServiceItems(
      query: FilterItemRequestDTO,
        token: UserToken,
        @Req() req,
        skip: number,
        limit: number
      ) {
        try {
          
    
          let data = await this.serviceItemModel
            .find(query)
            .populate({
              path: "itemId",
              populate: [
                {
                  path: "platformItemId",
                },
              ],
            }).populate("user")
            .lean()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);
    
          return {data:data};
        } catch (err) {
          throw err;
        }
      }
}

import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { serviceitems } from './schema/serviceItem.schema';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { FilterItemRequestDTO } from './dto/filter-item.dto';
import { HelperService } from "src/helper/helper.service";

@Injectable()
export class ServiceItemService {

  constructor(
    @InjectModel("serviceitems") private serviceItemModel: Model<serviceitems>,
    private helperService: HelperService
  ) { }
  async getServiceItems(
    query: FilterItemRequestDTO,
    token: UserToken,
    @Req() req,
    skip: number,
    limit: number
  ) {
    try {
     
      let filter = {};
      if (query.skill) {
        filter["skill"] = query.skill
      }
     if (query.languageCode) {
        filter["language.languageCode"] = query.languageCode
      }

      let data: any = await this.serviceItemModel
        .find(filter)
       .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        ;
      let count = await this.serviceItemModel.countDocuments();

      let userIds = data.map((e) => e.userId);

  for (let i = 0; i< userIds.length;i++ ){
   let userID = [userIds[i]]
 let profileInfo = await this.helperService.getProfileById(
  userID,
       req,
      null,
     );

     data[i]["profileData"] = profileInfo;

  }


     return data;
    } catch (err) {
      throw err;
    }
  }



}



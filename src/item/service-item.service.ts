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
      console.log(query);
      let filter = {};
      if (query.skill) {
        filter["skill"] = query.skill
      }
     if (query.languageCode) {
        filter["language.languageCode"] = query.languageCode
      }
      console.log(filter);
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
        console.log(data);
      let count = await this.serviceItemModel.countDocuments();

      let userIds = data.map((e) => e.userId);
       if (userIds.length) {
       let profileDetails = await this.helperService.getProfileById(
        data.userId,
         req,
        null,
       );
       console.log("Profile details: "+profileDetails);
       let user = profileDetails["profileData"].reduce((a, c) => {
      a[c.userId] = c;
         return a;
       }, {});
       data.map((e) => {
        return (e["profileData"] = user[data.userId]);
       });}
      console.log(data);
      return { data: data };
    } catch (err) {
      throw err;
    }
  }



}



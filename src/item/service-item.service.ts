import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { serviceItem } from '../item/schema/serviceIte.schema';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { FilterItemRequestDTO } from './dto/filter-item.dto';
import { HelperService } from "src/helper/helper.service";

@Injectable()
export class ServiceItemService {
   
    constructor(
        @InjectModel("serviceItem") private serviceItemModel: Model<serviceItem>,
        private helperService: HelperService
    ){}
    async getServiceItems(
      query: FilterItemRequestDTO,
        token: UserToken,
        @Req() req,
        skip: number,
        limit: number
      ) {
        try {
            let filter = {};
            if(query.skill){
                filter["skill"] = query.skill
              }
            if(query.skill){
                filter["language.languageCode"] = query.languageCode
              }
    
          let data : any = await this.serviceItemModel
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
            .limit(limit);

            let count = await this.serviceItemModel.countDocuments();
      
            let userIds = data.map((e) => e.userId);
            if (userIds.length) {
            let profileDetails = await this.helperService.getProfileById(
              data.userId,
              req,
              "Expert",
            );
            let user = profileDetails["profileData"].reduce((a, c) => {
              a[c.userId] = c;
              return a;
            }, {});
            data.map((e) => {
              return (e["profileData"] = user[data.userId]);
            });}
          return {data:data,count:count};
        } catch (err) {
          throw err;
        }
      }
      async getServiceItemDetail(id: any) {
        try {
          let data = await this.serviceItemModel.findOne({ _id: id });
          return data;
        } catch (err) {
          throw err;
        }
      }
      
      
}



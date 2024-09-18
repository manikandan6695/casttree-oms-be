import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { IPlatformItemModel } from './schema/platform-item.schema';
import { FilterPlatformItemDTO } from './dto/filter-platformItem.dto';


@Injectable()
export class ItemService {

    constructor(
        @InjectModel("platformItem") private platformItem: Model<IPlatformItemModel>,

    ) { }
    async getPlatformItem(
        query: FilterPlatformItemDTO,
        token: UserToken,
        skip: number,
        limit: number
    ) {
        try {
            let filter = {};

            if (query.itemName) {
                filter = { "itemName": query.itemName }
            }
            let data = await this.platformItem
                .find(filter, { _id: 0, itemName: 1 })
                .sort({ itemName: 1 })
                .skip(skip)
                .limit(limit)
                .lean();
            let countData = await this.platformItem.countDocuments(filter);
            let count = countData;
            return { data: data, count: countData };



        } catch (err) {
            throw err;
        }
    }
}

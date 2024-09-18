import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { IPlatformItemModel } from './schema/platform-item.schema';


@Injectable()
export class ItemService {

    constructor(
        @InjectModel("platformItem") private platformItem: Model<IPlatformItemModel>,

    ) { }
    async getPlatformItem(
        token: UserToken,
        skip: number,
        limit: number
    ) {
        try {

            let data: any = await this.platformItem
                .find({}, { _id: 0, itemName: 1 })
                .sort({ itemName: 1 })
                .skip(skip)
                .limit(limit)
                .lean();
            return data;


        } catch (err) {
            throw err;
        }
    }
}

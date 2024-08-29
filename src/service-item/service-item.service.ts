import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { serviceItem } from './schema/serviceIte.schema';

@Injectable()
export class ServiceItemService {
    constructor(
        @InjectModel("serviceItem") private serviceItemModel: Model<serviceItem>,
     
      ){}
      getData(language:string,skill:string){
      return this.serviceItemModel.find({skill: skill,"language.languageCode": language});
      }

}

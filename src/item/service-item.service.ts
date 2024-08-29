import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { serviceItem } from '../item/schema/serviceIte.schema';

@Injectable()
export class ServiceItemService {
    constructor(
        @InjectModel("serviceItem") private serviceItemModel: Model<serviceItem>,
     
      ){}
      getData(language?:string,skill?:string){
if(!language && skill){
  return this.serviceItemModel.find({skill: skill}).populate("item").populate('profile');
}
if(language && !skill){
  return this.serviceItemModel.find({"language.languageCode": language}).populate("item").populate('profile');
}
if(language && skill){
  return this.serviceItemModel.find({skill: skill,"language.languageCode": language}).populate("item").populate('profile');
}
}
}

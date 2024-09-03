import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { serviceItem } from './schema/serviceItem.schema';
import { FilterItemRequestDTO } from './dto/filter-item.dto';

@Injectable()
export class ItemService {

  
}

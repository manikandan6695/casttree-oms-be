import { Controller, Get, ParseIntPipe, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ServiceItemService } from './service-item.service';


@Controller('service-item')
export class ServiceItemController {
    constructor(private serviceItemService: ServiceItemService){
       
    }
    @Get()
    @UsePipes(new ValidationPipe())

    getExpertData(@Query("skill",) skill?: string,
    @Query("language") language?: string){
  return  this.serviceItemService.getData(language,skill);
    }
}

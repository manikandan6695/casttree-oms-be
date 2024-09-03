import { Controller, Get, ParseIntPipe, Post, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ServiceItemService } from './service-item.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { FilterItemRequestDTO } from './dto/filter-item.dto';
import { GetToken } from 'src/shared/decorator/getuser.decorator';
import { UserToken } from 'src/auth/dto/usertoken.dto';


@Controller('service-item')
export class ServiceItemController {
    constructor(private serviceItemService: ServiceItemService){
       
    }
    @UseGuards(JwtAuthGuard)
    @Get()
    async getServiceItems(
      @Req() req,
      @Query(ValidationPipe) query: FilterItemRequestDTO,
      @Query("skip", ParseIntPipe) skip: number,
      @Query("limit", ParseIntPipe) limit: number,
      @GetToken() token: UserToken,
      @Res() res: Response
    ) {
      try {
        let data = await this.serviceItemService.getServiceItems(
          query,
          token,
          req,
          skip,
          limit
        );
        return data;
      } catch (err) {
       
        
        return err;
      }
    }
}

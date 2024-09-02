import { Controller, Get, ParseIntPipe, Query, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetToken } from 'src/shared/decorator/getuser.decorator';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { ItemService } from './item.service';
import { response } from 'express';
import { FilterItemRequestDTO } from './dto/filter-item.dto';

@Controller('item')
export class ItemController {
    constructor(private serviceItemService: ItemService){
       
    }

    @UseGuards(JwtAuthGuard)
    @Get('serviceItem')
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

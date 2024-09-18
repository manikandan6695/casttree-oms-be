import { Controller, Get, ParseIntPipe, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetToken } from 'src/shared/decorator/getuser.decorator';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { ItemService } from './item.service';
import { FilterPlatformItemDTO } from './dto/filter-platformItem.dto';

@Controller('item')
export class ItemController {
    constructor(private itemService: ItemService) { }
    @UseGuards(JwtAuthGuard)
    @Get('platformItem')
    async getPlatformItem(@GetToken() token: UserToken,
        @Query(ValidationPipe) query: FilterPlatformItemDTO,
        @Query("skip", ParseIntPipe) skip: number,
        @Query("limit", ParseIntPipe) limit: number,) {
        try {
            console.log(query);
            let data = await this.itemService.getPlatformItem(
                query,
                skip,
                limit
            );
            return data;
        } catch (err) {
            return err;
        }
    }
}

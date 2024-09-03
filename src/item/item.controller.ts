import { Controller, Get, ParseIntPipe, Query, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetToken } from 'src/shared/decorator/getuser.decorator';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { ItemService } from './item.service';
import { response } from 'express';
import { FilterItemRequestDTO } from './dto/filter-item.dto';
import { ServiceItemService } from './service-item.service';

@Controller('item')
export class ItemController {
    
}

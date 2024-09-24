import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { createRatingsDto } from './dto/createRating.dto';
import { RatingsService } from './ratings.service';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { ObjectId } from 'mongodb';
import { GetToken } from 'src/shared/decorator/getuser.decorator';

@Controller('ratings')
export class RatingsController {
    constructor(private ratingsService: RatingsService){
       
    }
    @Post()
    createRating(@Body(new ValidationPipe({ whitelist: true })) createratingdto : createRatingsDto,@GetToken() token:UserToken){
       console.log("userId from token is : "+ new ObjectId(token.id));
    return this.ratingsService.createRating(createratingdto);
    }


    @Get(':sourceType/:sourceId/aggregate')
    @UsePipes(new ValidationPipe())
    getUserAggregated(@Param('sourceType')  sourceType :string,@Param('sourceId')  sourceId :string, @Req() req){
        return this.ratingsService.getReviewSummary(sourceType,sourceId,req["headers"]["authorization"]);
    }

    @Get(':sourceType/:sourceId/allReviews')
    @UsePipes(new ValidationPipe())
    getAllReviews(@Param('sourceType')  sourceType :string,@Param('sourceId')  sourceId :string ,    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number, @Req() req) {
        return this.ratingsService.getAllReviews(sourceType,sourceId,skip,
            limit,req["headers"]["authorization"]);
    }
}

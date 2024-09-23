import { Module } from '@nestjs/common';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ratingaggregatedSchema, ratingSchema } from './schema/ratings-schema';
import { AuthModule } from 'src/auth/auth.module';
import { HelperModule } from 'src/helper/helper.module';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: "Ratingsv1",
      schema: ratingSchema
    }
    , {
      name: "Ratingsaggregated",
      schema: ratingaggregatedSchema
    }
  ]), AuthModule,
    HelperModule],
  controllers: [RatingsController],
  providers: [RatingsService]
})
export class RatingsModule { }

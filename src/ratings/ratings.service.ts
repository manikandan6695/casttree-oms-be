import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ratingsaggregated, Ratingsv1 } from './schema/ratings-schema';
import { Model } from 'mongoose';
import { createRatingsDto } from './dto/createRating.dto';
import { HelperService } from "src/helper/helper.service";

@Injectable()
export class RatingsService {
    constructor(
        @InjectModel("Ratingsv1") private ratingModel: Model<Ratingsv1>,
        @InjectModel("Ratingsaggregated") private aggregatedratingModel: Model<Ratingsaggregated>,
        private helperService: HelperService
    ) { }

    async createRating(body: createRatingsDto) {
        try {
            const isNotFirst = await this.ratingModel.findOne({
                sourceId: body.sourceId
            });

            const newRating = new this.ratingModel(body)
            const insertedRating = await newRating.save();
            if (isNotFirst == null) {
                const aggregatedBody = {
                    sourceId: body.sourceId,
                    sourceType: body.sourceType,
                    averageOverallRating: body.overAllRating,
                    scale: body.scale,
                    totalReviewNumber: 1
                }
                const newAggregatedRating = new this.aggregatedratingModel(aggregatedBody);
                return newAggregatedRating.save();
            }
            else {
                const oldAggregated: any = await this.aggregatedratingModel.findOne({
                    sourceId: body.sourceId
                });
                console.log(oldAggregated);
                const oldAverage = oldAggregated.averageOverallRating;
                const oldCount = oldAggregated.totalReviewNumber;
                const newAverage = (oldAverage + body.overAllRating);
                return this.aggregatedratingModel.findOneAndUpdate({ sourceId: body.sourceId }, { averageOverallRating: newAverage, totalReviewNumber: (oldCount + 1) });
            }
        } catch (err) {
            throw err;
        }

    }


    async getReviewSummary(sourceType: string, sourceId: string, accessToken: string) {
        try {
            let allReviews: any = await this.ratingModel.find({
                sourceId: sourceId, sourceType: sourceType
            }).sort({ _id: -1 }).limit(10)
               .lean();
            let aggregated: any = await this.aggregatedratingModel.findOne({
                sourceId: sourceId, sourceType: sourceType
            }).lean();
            const profileInfo = await this.helperService.getProfileById(
                [aggregated.sourceId],
                accessToken,
                null
            );
            aggregated["profileData"] = profileInfo[0];
            const reviewerUserIds = allReviews.map((e) => e.reviewedBy);
            const allProfileInfo = await this.helperService.getProfileById(
                reviewerUserIds,
                accessToken,
                null
            );
            var userProfileInfo = allProfileInfo.reduce((a, c) => {
                a[c.userId] = c;
                return a;
            }, {});

            for (let i = 0; i < allReviews.length; i++) {
                allReviews[i]["profileData"] = userProfileInfo[allReviews[i]["reviewedBy"]]
            }

            let final_response: { [key: string]: string } = {
                "aggregated": aggregated,
                "reviews": allReviews,
            };
            return { data: final_response };
        } catch (err) {
            throw err;
        }

    }

    async getAllReviews(sourceType: string, sourceId: string, skip: number, limit: number,  accessToken) {
        try {
            const allReviews: any = await this.ratingModel.find({
                sourceId: sourceId, sourceType: sourceType
            }).sort({ _id: -1 }).skip(skip)
                .limit(limit).lean();
                const reviewerUserIds = allReviews.map((e) => e.reviewedBy);
                const allProfileInfo = await this.helperService.getProfileById(
                    reviewerUserIds,
                    accessToken,
                    null
                );
                var userProfileInfo = allProfileInfo.reduce((a, c) => {
                    a[c.userId] = c;
                    return a;
                }, {});
    
                for (let i = 0; i < allReviews.length; i++) {
                    allReviews[i]["profileData"] = userProfileInfo[allReviews[i]["reviewedBy"]]
                }
            return allReviews;
        } catch (err) {
            throw err;
        }

    }
}

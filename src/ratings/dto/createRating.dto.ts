import { IsMongoId, IsNotEmpty, IsString } from "class-validator";

export class createRatingsDto {
    @IsNotEmpty()
    @IsMongoId()
    sourceId: string;

    @IsNotEmpty()
    @IsString()
    sourceType: string;

    @IsNotEmpty()
    overAllRating: number;

    @IsNotEmpty()
    scale: number;

    @IsNotEmpty()
    overAllDescription: string;

    @IsNotEmpty()
    status: string;

    @IsNotEmpty()
    @IsMongoId()
    reviewedBy: string;

}
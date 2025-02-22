import { IsNotEmpty, IsString } from "class-validator";

export class getServiceRequestRatingsDto {
    @IsNotEmpty()
    transactionIds: string | string[];

    @IsNotEmpty()
    @IsString()
    userId: string ;
}
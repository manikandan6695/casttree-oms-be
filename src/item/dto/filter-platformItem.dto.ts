import {
    IsOptional,
    IsString,
} from "class-validator";
export class FilterPlatformItemDTO {
    @IsOptional()
    @IsString()
    itemName?: string;

    @IsOptional()
    @IsString()
    groupKey?: string;


}
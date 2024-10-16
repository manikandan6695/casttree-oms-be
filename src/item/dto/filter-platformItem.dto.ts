import {
    IsOptional,
    IsString,
} from "class-validator";
export class FilterPlatformItemDTO {
    @IsOptional()
    @IsString()
    itemName?: string;



}
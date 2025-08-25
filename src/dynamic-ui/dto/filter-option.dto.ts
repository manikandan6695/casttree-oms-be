import { IsOptional, IsString, IsArray, IsMongoId, ValidateIf } from "class-validator";
import { Transform } from "class-transformer";

export class EFilterOption {

    @IsOptional()
    @ValidateIf((o) => o.proficiency !== null)
    @IsString()
    proficiency?: string | null;

    @IsOptional()
    @ValidateIf((o) => o.category !== null)
    @Transform(({ value }) => {
        if (value === null || value === undefined) {
            return [];
        }
        if (typeof value === 'string') {
            return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
        return Array.isArray(value) ? value.filter(item => item && item.length > 0) : [];
    })
    @IsArray()
    @IsString({ each: true })
    category?: string[] | null;
}
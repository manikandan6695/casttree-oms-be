import { IsOptional, IsString, IsArray, IsMongoId, ValidateIf, IsInt, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

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

export class ComponentFilterQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Transform(({ value }) => parseInt(value))
    skip?: number = 0;
    
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    limit?: number = 10;
  }
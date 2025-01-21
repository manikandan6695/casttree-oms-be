import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from "class-validator";
import { EprocessStatus } from "../enums/process.enum";

export class updateProcessInstanceDTO {
    @IsNotEmpty()
    @IsMongoId()
    taskId: string;

    @IsOptional()
    @IsEnum(EprocessStatus)
    processStatus: EprocessStatus;

    @IsOptional()
    taskResponse: any;
}
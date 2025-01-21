import { IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EprocessStatus, EtaskType } from "../enums/courses.enum";

export class processInstanceDTO {
    @IsNotEmpty()
    @IsMongoId()
    processId: string;

    @IsOptional()
    @IsEnum(EtaskType)
    processType: EtaskType;

    @IsOptional()
    @IsDateString()
    startedAt: string;

    @IsOptional()
    @IsString()
    orderId: string;

    @IsOptional()
    @IsString()
    processStatus: string;

    @IsNotEmpty()
    @IsMongoId()
    currentSubProcess: string;

    @IsNotEmpty()
    @IsMongoId()
    currentTask: string;

    @IsOptional()
    @IsDateString()
    purchasedAt: string;

    @IsOptional()
    @IsDateString()
    validTill: string;

    @IsOptional()
    @IsString()
    status: string;

    @IsOptional()
    @IsMongoId()
    userId: string;

    @IsOptional()
    @IsMongoId()
    createdBy: string;

    @IsOptional()
    @IsMongoId()
    updatedBy: string;

}

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
import { IsString, IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePriorityOrderDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  processId: string;

  @IsNumber()
  @IsNotEmpty()
  priorityOrder: number;
}

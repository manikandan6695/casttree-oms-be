import { IsNotEmpty, IsString } from "class-validator";

export class RedisDTO {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  value: any;

  expireTime?: number | string;
}

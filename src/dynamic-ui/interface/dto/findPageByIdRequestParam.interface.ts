import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, Length } from "class-validator";

export class FindPageByIdRequestParam {
  @IsAlphanumeric()
  @Length(32, 32)
  @ApiProperty({ example: "6548efa9e66c3e5015b41ae1" })
  readonly id: string;
}

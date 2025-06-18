import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class UserRequestDto {
  @ApiProperty({ description: "User ID" })
  @IsString()
  @IsNotEmpty()
  id: string;
}

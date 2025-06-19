import { ApiProperty } from "@nestjs/swagger";
import { FindPageByIdResult } from "src/dynamic-ui/infrastructure/query/impl/FindPageByResult.result";

export class FindPageByIdResponseDTO extends FindPageByIdResult {
  @ApiProperty()
  data: any;
}

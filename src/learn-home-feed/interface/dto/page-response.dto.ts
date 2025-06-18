import { ApiProperty } from "@nestjs/swagger";

export class PageResponseDto {
  @ApiProperty({ description: "Success status" })
  success: boolean;

  @ApiProperty({ description: "Response message" })
  message: string;

  @ApiProperty({ description: "Page data" })
  data: {
    _id: string;
    pageName: string;
    key: string;
    components: Array<{
      _id: string;
      componentKey: string;
      displayType: string;
      type: string;
      title: string;
      subtitle: string;
      order: number;
      apiSpec: any;
      metaData: any;
      navigation: any;
      media: any;
    }>;
  };
}

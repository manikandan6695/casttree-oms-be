import { ApiProperty } from "@nestjs/swagger";

export class PageDetailsDto {
  @ApiProperty({ description: "Page ID" })
  _id: string;

  @ApiProperty({ description: "Page name" })
  pageName: string;

  @ApiProperty({ description: "Page key" })
  key: string;

  @ApiProperty({ description: "Background color code" })
  bgColorCode: string;
}

export class TabDto {
  @ApiProperty({ description: "Tab ID" })
  _id: string;

  @ApiProperty({ description: "Tab name" })
  name: string;

  @ApiProperty({ description: "Tab icon" })
  icon: string;

  @ApiProperty({ description: "Associated page ID" })
  pageId: string;

  @ApiProperty({ type: PageDetailsDto, description: "Associated page details" })
  pageDetails: PageDetailsDto;
}

export class NavBarDetailsDto {
  @ApiProperty({ description: "Navigation bar ID" })
  _id: string;

  @ApiProperty({ description: "Navigation bar name" })
  name: string;

  @ApiProperty({ description: "Navigation bar key" })
  key: string;

  @ApiProperty({ description: "Navigation bar position" })
  position: string;

  @ApiProperty({ description: "Navigation bar orientation" })
  orientation: string;

  @ApiProperty({ type: [TabDto], description: "Navigation bar tabs" })
  tabs: TabDto[];
}

export class NavBarResponseDto {
  @ApiProperty({ description: "Success status" })
  success: boolean;

  @ApiProperty({ description: "Response message" })
  message: string;

  @ApiProperty({
    type: NavBarDetailsDto,
    description: "Navigation bar details",
  })
  data: NavBarDetailsDto;
}

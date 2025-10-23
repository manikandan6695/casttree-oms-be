import { IsString, IsNotEmpty } from 'class-validator';

export class GetBannerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class BannerResponseDto {
  @IsString()
  bannerToShow: string;
}

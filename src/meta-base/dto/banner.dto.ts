import { IsString, IsNotEmpty } from 'class-validator';

export class GetBannerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  skillId: string;

  @IsString()
  @IsNotEmpty()
  skillType: string;

  @IsString()
  @IsNotEmpty()
  componentKey: string;
}

export class BannerResponseDto {
  @IsString()
  bannerToShow: string;
}

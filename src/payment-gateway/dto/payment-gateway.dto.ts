import { IsNotEmpty, IsString, IsEnum } from "class-validator";

export class GetSupportedInstrumentsQueryDto {
  @IsNotEmpty()
  @IsString()
  @IsEnum(["payments", "subscription"])
  paymentType: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(["android", "ios", "web"])
  device: string;
}

export class InstrumentDto {
  id: string;
  displayName: string;
  imageUrl?: string;
  available: boolean;
  status: string;
}

export class InstrumentsResponseDto {
  paymentType: string;
  device: string;
  instruments: InstrumentDto[];
}


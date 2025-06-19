import { IsArray, IsObject, IsOptional, IsString } from "class-validator";
import { ENotifyChannel } from "../../../notification/interface/enum/notification.enum";

export class novuUserCreateOrUpdateDTO {
  @IsOptional()
  @IsString()
  subscriberId?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  data?: any;
}

export class SdkTriggerDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  toolId?: string;

  @IsOptional()
  @IsArray()
  subscriberIds?: string[];

  @IsOptional()
  payload?: any;

  @IsOptional()
  @IsObject()
  overrides?: object;
}

export class NovuCredentialsDto {
  subscriberId: string;
  providerId: string;
  credentials: IChannelCredentials;
  integrationIdentifier?: string;
}

export class NovuCredentialsUpdateDto {
  subscriberId: string;
  provider: string;
  channel: ENotifyChannel;
  token: string;
}

export class IChannelCredentials {
  webhookUrl?: string;
  channel?: string;
  deviceTokens?: string[];
}

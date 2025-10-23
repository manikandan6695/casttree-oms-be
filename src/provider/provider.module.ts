import { Module } from "@nestjs/common";
import { ProviderController } from "./provider.controller";
import { ProviderService } from "./provider.service";
import { SharedModule } from "src/shared/shared.module";
import { LoggerModule } from "src/logger/logger.module";
import { HttpModule } from "@nestjs/axios";
import { MongooseModule } from "@nestjs/mongoose";
import { SystemConfigurationSchema } from "src/shared/schema/system-configuration.schema";

@Module({
  imports: [
    SharedModule,
    LoggerModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: "systemConfiguration", schema: SystemConfigurationSchema },
    ]),
  ],
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}

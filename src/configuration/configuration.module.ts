import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigurationController } from "./configuration.controller";
import { ConfigurationService } from "./configuration.service";
import { ConfigurationDefaultSchema } from "./schema/configuration-defaults.schema";
import { ConfigurationSchema } from "./schema/configuration.schema";
import { SystemConfigurationSchema } from "./schema/system-configuration.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "system-configuration", schema: SystemConfigurationSchema },
      { name: "configuration", schema: ConfigurationSchema },
      { name: "configurationDefaults", schema: ConfigurationDefaultSchema },
    ]),
  ],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}

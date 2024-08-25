import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { ServiceProviderHelperModule } from "src/service-provider-helper/service-provider-helper.module";
import { AppTypeController } from "./app-type/app-type.controller";
import { AppTypeService } from "./app-type/app-type.service";
import { MessageProviderService } from "./message/message.service";
import { ApplicationCredentialSchema } from "./schema/app-credential.schema";
import { ApplicationTypeSchema } from "./schema/app-type.schema";
import { DefaultApplicationCredentialSchema } from "./schema/default-app-credential.schema";
import { ServiceProviderService } from "./service-provider.service";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: "applicationType", schema: ApplicationTypeSchema },
      { name: "applicationCredential", schema: ApplicationCredentialSchema },
      {
        name: "default-application-credential",
        schema: DefaultApplicationCredentialSchema,
      },
    ]),
    ServiceProviderHelperModule,
  ],
  controllers: [AppTypeController],
  providers: [ServiceProviderService, AppTypeService, MessageProviderService],
  exports: [ServiceProviderService, AppTypeService, MessageProviderService],
})
export class ServiceProviderModule {}

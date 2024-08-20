import {  Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from '@nestjs/axios'
import { LoggerModule } from "src/logger/logger.module";
// import { MailerModule } from "src/mailer/mailer.module";
import { ApplicationCredentialSchema } from "src/service-provider/schema/app-credential.schema";
import { ApplicationTypeSchema } from "src/service-provider/schema/app-type.schema";
import { DefaultApplicationCredentialSchema } from "src/service-provider/schema/default-app-credential.schema";
import { SharedModule } from "src/shared/shared.module";
import { ServiceProviderHelperService } from "./service-provider-helper.service";
@Module({
  imports: [
    SharedModule,
    LoggerModule,
    HttpModule,
    // MailerModule,
    MongooseModule.forFeature([
      { name: "applicationType", schema: ApplicationTypeSchema },
      // { name: "application", schema: ApplicationSchema },
      { name: "applicationCredential", schema: ApplicationCredentialSchema },
      {
        name: "default-application-credential",
        schema: DefaultApplicationCredentialSchema,
      },
    ]),
  ],
  providers: [ServiceProviderHelperService],
  exports: [ServiceProviderHelperService],
})
export class ServiceProviderHelperModule {}

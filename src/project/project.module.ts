import { ItemDocumentSchema } from "./../invoice/schema/item-document.schema";
import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApplicationSchema } from "src/application/schema/application.schema";
import { AuthModule } from "src/auth/auth.module";
import { SalesDocumentSchema } from "src/invoice/schema/sales-document.schema";
import { PaymentSchema } from "src/payment-request/schema/payment.schema";
import { SharedModule } from "src/shared/shared.module";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";
import { projectsSchema } from "./schema/project.schema";
import { NominationsModule } from "src/nominations/nominations.module";
import { CtApiModule } from "src/ct-api/ct-api.module";
import { PeertubeModule } from "src/peertube/peertube.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "project", schema: projectsSchema },
      { name: "application", schema: ApplicationSchema },
      { name: "salesDocument", schema: SalesDocumentSchema },
      { name: "payment", schema: PaymentSchema },
      { name: "itemDocument", schema: ItemDocumentSchema },
    ]),
    SharedModule,
    AuthModule,
    forwardRef(() => NominationsModule),
    CtApiModule,
    PeertubeModule
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}

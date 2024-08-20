import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { ItemDocumentSchema } from "src/item-document/item-document.schema";
import { ItemDocumentService } from "src/item-document/item-document.service";
import { SharedModule } from "src/shared/shared.module";
import { InvoiceController } from "./invoice.controller";
import { InvoiceService } from "./invoice.service";
import { SalesDocumentSchema } from "./schema/sales-document.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "salesDocument", schema: SalesDocumentSchema },
      { name: "itemDocument", schema: ItemDocumentSchema },
    ]),
    SharedModule,
    AuthModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, ItemDocumentService],
  exports: [InvoiceService, ItemDocumentService],
})
export class InvoiceModule {}

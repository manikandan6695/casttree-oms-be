import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { ItemDocumentSchema } from "src/item-document/item-document.schema";
import { ItemDocumentService } from "src/item-document/item-document.service";
import { ItemSchema } from "src/item/schema/item.schema";
import { SharedModule } from "src/shared/shared.module";
import { InvoiceController } from "./invoice.controller";
import { InvoiceService } from "./invoice.service";
import { SalesDocumentSchema } from "./schema/sales-document.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "salesDocument", schema: SalesDocumentSchema },
      { name: "itemDocument", schema: ItemDocumentSchema },
      { name: "item", schema: ItemSchema },
    ]),
    SharedModule,
    AuthModule,
    forwardRef(() => HelperModule),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, ItemDocumentService],
  exports: [InvoiceService, ItemDocumentService],
})
export class InvoiceModule {}

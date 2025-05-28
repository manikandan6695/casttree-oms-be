import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TaxSpecificationSchema } from "./schema/tax-specification.schema";
import { TaxTypeSchema } from "./schema/tax-type.schema";
import { TaxSchema } from "./schema/tax.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      //   { name: "item", schema: ItemSchema },
      //   { name: "itemDocument", schema: ItemDocumentSchema },
      { name: "tax", schema: TaxSchema },
      //   { name: "gstSettings", schema: GSTSettingsSchema },
      { name: "taxType", schema: TaxTypeSchema },
      { name: "taxSpecification", schema: TaxSpecificationSchema },
      //   { name: "taxExemptions", schema: TaxExemptionsSchema },
    ]),
    // SharedModule,
    // AuthModule,
    // SubscriptionHelperModule,
  ],
  //   providers: [TaxService, TaxSpecificationService, GstSettingsService],
  //   controllers: [
  //     TaxController,
  //     TaxSpecificationController,
  //     GstSettingsController,
  //   ],
  //   exports: [TaxService, GstSettingsService],
})
export class TaxModule {}

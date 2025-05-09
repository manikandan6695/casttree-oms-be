// import { Module } from "@nestjs/common";
// import { MongooseModule } from "@nestjs/mongoose";
// import { AuthModule } from "src/auth/auth.module";
// import { ItemSchema } from "src/item/schema/item.schema";
// import { ItemDocumentSchema } from "src/sales-document/schema/item-document.schema";
// import { SharedModule } from "src/shared/shared.module";
// import { SubscriptionHelperModule } from "src/subscription-helper/subscription-helper.module";
// import { TaxExemptionsSchema } from "src/tax-exemptions/schema/tax-exemptions.schema";
// import { GstSettingsController } from "./gst-settings/gst-settings.controller";
// import { GstSettingsService } from "./gst-settings/gst-settings.service";
// import { GSTSettingsSchema } from "./gst-settings/schema/gst-settings.schema";
// import { TaxSpecificationSchema } from "./schema/tax-specification.schema";
// import { TaxTypeSchema } from "./schema/tax-type.schema";
// import { TaxSchema } from "./schema/tax.schema";
// import { TaxSpecificationController } from "./tax-specification/tax-specification.controller";
// import { TaxSpecificationService } from "./tax-specification/tax-specification.service";
// import { TaxController } from "./tax.controller";
// import { TaxService } from "./tax.service";

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: "item", schema: ItemSchema },
//       { name: "itemDocument", schema: ItemDocumentSchema },
//       { name: "tax", schema: TaxSchema },
//       { name: "gstSettings", schema: GSTSettingsSchema },
//       { name: "taxType", schema: TaxTypeSchema },
//       { name: "taxSpecification", schema: TaxSpecificationSchema },
//       { name: "taxExemptions", schema: TaxExemptionsSchema },
//     ]),
//     SharedModule,
//     AuthModule,
//     SubscriptionHelperModule,
//   ],
//   providers: [TaxService, TaxSpecificationService, GstSettingsService],
//   controllers: [
//     TaxController,
//     TaxSpecificationController,
//     GstSettingsController,
//   ],
//   exports: [TaxService, GstSettingsService],
// })
// export class TaxModule {}

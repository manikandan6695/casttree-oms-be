import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { ProcessModule } from "src/process/process.module";
import { ServiceRequestModule } from "src/service-request/service-request.module";
import { ItemController } from "./item.controller";
import { ItemService } from "./item.service";
import { AssociatedItemsSchema } from "./schema/associated-items.schema";
import { inventorySchema } from "./schema/inventory.schema";
import { ItemSchema } from "./schema/item.schema";
import { ManufacturerSchema } from "./schema/manufacturer.schema";
import { platformItemSchema } from "./schema/platform-item.schema";
import { PriceListItemsSchema } from "./schema/price-list-items.schema";
import { PriceListSchema } from "./schema/price-list.schema";
import { serviceitemsSchema } from "./schema/serviceItem.schema";
import { VariantSchema } from "./schema/variant.schema";
import { ServiceItemController } from "./service-item.controller";
import { ServiceItemService } from "./service-item.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "item", schema: ItemSchema },
      { name: "associatedItems", schema: AssociatedItemsSchema },
      { name: "manufacturer", schema: ManufacturerSchema },
      { name: "variant", schema: VariantSchema },
      { name: "inventory", schema: inventorySchema },
      { name: "priceList", schema: PriceListSchema },
      { name: "priceListItems", schema: PriceListItemsSchema },
      { name: "platformItem", schema: platformItemSchema },
      { name: "serviceitems", schema: serviceitemsSchema },
    
    ]),
    AuthModule,
    HelperModule,
    forwardRef(() =>  ServiceRequestModule),
    forwardRef(() =>  ProcessModule)
  ],
  controllers: [ItemController, ServiceItemController],
  providers: [ItemService, ServiceItemService],
  exports: [ItemService, ServiceItemService],
})
export class ItemModule {}

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { ItemController } from "./item.controller";
import { ItemService } from "./item.service";
import { AssociatedItemsSchema } from "./schema/associated-items.schema";
import { inventorySchema } from "./schema/inventory.schema";
import { ItemSchema } from "./schema/item.schema";
import { ManufacturerSchema } from "./schema/manufacturer.schema";
import { platformItemSchema } from "./schema/platform-item.schema";
import { PriceListSchema } from "./schema/price-list.schema";
import { VariantSchema } from "./schema/variant.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "item", schema: ItemSchema },
      { name: "associatedItems", schema: AssociatedItemsSchema },
      { name: "manufacturer", schema: ManufacturerSchema },
      { name: "variant", schema: VariantSchema },
      { name: "inventory", schema: inventorySchema },
      { name: "priceList", schema: PriceListSchema },
      { name: "platformItem", schema: platformItemSchema },
    ]),
    AuthModule,
  ],
  controllers: [ItemController],
  providers: [ItemService],
})
export class ItemModule {}

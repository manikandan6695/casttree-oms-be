import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ItemSyncService } from "./item-sync.service";
import { ItemSyncEntity } from "./item-sync.entity";
import { ItemSchema } from "./schema/item.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "item", schema: ItemSchema }
    ]),
    TypeOrmModule.forFeature([ItemSyncEntity])
  ],
  providers: [ItemSyncService],
  exports: [ItemSyncService]
})
export class ItemSyncModule {}

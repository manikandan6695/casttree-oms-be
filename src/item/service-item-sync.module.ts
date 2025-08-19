import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServiceItemSyncService } from "./service-item-sync.service";
import { ServiceItemSyncEntity } from "./service-item-sync.entity";
import { serviceitemsSchema } from "./schema/serviceItem.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "serviceitems", schema: serviceitemsSchema }
    ]),
    TypeOrmModule.forFeature([ServiceItemSyncEntity])
  ],
  controllers: [],
  providers: [ServiceItemSyncService],
  exports: [ServiceItemSyncService]
})
export class ServiceItemSyncModule {}

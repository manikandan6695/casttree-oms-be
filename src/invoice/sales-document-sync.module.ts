import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SalesDocumentSyncService } from "./sales-document-sync.service";
import { SalesDocumentSyncController } from "./sales-document-sync.controller";
import { SalesDocumentSyncEntity } from "./sales-document-sync.entity";
import { SalesDocumentSchema } from "./schema/sales-document.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "salesDocument", schema: SalesDocumentSchema }
    ]),
    TypeOrmModule.forFeature([SalesDocumentSyncEntity])
  ],
  controllers: [SalesDocumentSyncController],
  providers: [SalesDocumentSyncService],
  exports: [SalesDocumentSyncService]
})
export class SalesDocumentSyncModule {}

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProcessInstanceDetailSyncService } from "./process-instance-detail-sync.service";
import { ProcessInstanceDetailSyncController } from "./process-instance-detail-sync.controller";
import { ProcessInstanceDetailSyncEntity } from "./process-instance-detail-sync.entity";
import { processInstanceDetailSchema } from "./schema/processInstanceDetails.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "processInstanceDetail", schema: processInstanceDetailSchema }
    ]),
    TypeOrmModule.forFeature([ProcessInstanceDetailSyncEntity])
  ],
  controllers: [ProcessInstanceDetailSyncController],
  providers: [ProcessInstanceDetailSyncService],
  exports: [ProcessInstanceDetailSyncService]
})
export class ProcessInstanceDetailSyncModule {}

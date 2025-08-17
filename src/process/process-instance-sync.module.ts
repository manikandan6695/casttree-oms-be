import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProcessInstanceSyncService } from "./process-instance-sync.service";
import { ProcessInstanceSyncController } from "./process-instance-sync.controller";
import { ProcessInstanceSyncEntity } from "./process-instance-sync.entity";
import { processInstanceSchema } from "./schema/processInstance.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "processInstance", schema: processInstanceSchema }
    ]),
    TypeOrmModule.forFeature([ProcessInstanceSyncEntity])
  ],
  controllers: [ProcessInstanceSyncController],
  providers: [ProcessInstanceSyncService],
  exports: [ProcessInstanceSyncService]
})
export class ProcessInstanceSyncModule {}

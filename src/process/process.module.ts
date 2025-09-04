import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { HelperModule } from "src/helper/helper.module";
import { ItemModule } from "src/item/item.module";
import { PaymentRequestModule } from "src/payment/payment-request.module";
import { SubscriptionModule } from "src/subscription/subscription.module";
import { ProcessController } from "./process.controller";
import { ProcessService } from "./process.service";
import { ProcessInstanceSyncService } from "./process-instance-sync.service";
import { ProcessInstanceSyncController } from "./process-instance-sync.controller";
import { ProcessInstanceSyncEntity } from "./process-instance-sync.entity";
import { processSchema } from "./schema/process.schema";
import { processInstanceSchema } from "./schema/processInstance.schema";
import { processInstanceDetailSchema } from "./schema/processInstanceDetails.schema";
import { taskSchema } from "./schema/task.schema";
import { RedisQueueService } from "../redis/redis-queue.service";
import { processInstanceSqlPoolProvider } from "./sql.provider";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: "process", schema: processSchema },
      { name: "processInstance", schema: processInstanceSchema },
      { name: "processInstanceDetail", schema: processInstanceDetailSchema },
      { name: "task", schema: taskSchema },
    ]),
    TypeOrmModule.forFeature([ProcessInstanceSyncEntity]),
    forwardRef(() => ItemModule),
    SubscriptionModule,
    PaymentRequestModule,
    HelperModule
  ],
  controllers: [ProcessController, ProcessInstanceSyncController],
  providers: [
    ProcessService,
    ProcessInstanceSyncService,
    RedisQueueService,
    processInstanceSqlPoolProvider
  ],
  exports: [ProcessService, ProcessInstanceSyncService],
})
export class ProcessModule { }

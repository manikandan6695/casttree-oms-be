import { BullModule } from "@nestjs/bullmq";
import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HelperModule } from "src/helper/helper.module";
import { processInstanceDetailProcessor, processInstanceProcessor, processProcessor, taskProcessor } from "src/helper/queue.processor";
import { ItemModule } from "src/item/item.module";
import { PaymentRequestModule } from "src/payment/payment-request.module";
import { SubscriptionModule } from "src/subscription/subscription.module";
import { ProcessController } from "./process.controller";
import { ProcessService } from "./process.service";
import { processSchema } from "./schema/process.schema";
import { processInstanceSchema } from "./schema/processInstance.schema";
import { processInstanceDetailSchema } from "./schema/processInstanceDetails.schema";
import { taskSchema } from "./schema/task.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "process", schema: processSchema },
      { name: "processInstance", schema: processInstanceSchema },
      { name: "processInstanceDetail", schema: processInstanceDetailSchema },
      { name: "task", schema: taskSchema },
    ]),
    forwardRef(() => ItemModule),
    SubscriptionModule,
    PaymentRequestModule,
    HelperModule,
    BullModule.registerQueue(
      {
        name: 'processInstance-events',
      },
      {
        name: 'processInstanceDetail-events',
      },
      {
        name: 'task-events',
      },
      {
        name: 'process-events',
      },
    ),
  ],
  controllers: [ProcessController],
  providers: [ProcessService,processInstanceProcessor,processInstanceDetailProcessor,taskProcessor,processProcessor],
  exports: [ProcessService],
})
export class ProcessModule { }

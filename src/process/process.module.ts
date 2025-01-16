import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemModule } from "src/item/item.module";
import { ProcessController } from "./process.controller";
import { ProcessService } from "./process.service";
import { errorResponseSchema } from "./schema/errorResponse.schema";
import { processSchema } from "./schema/process.schema";
import { processInstanceSchema } from "./schema/processInstance.schema";
import { processInstanceDetailSchema } from "./schema/processInstanceDetails.schema";
import { taskSchema } from "./schema/task.schema";
import { SubscriptionModule } from "src/subscription/subscription.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "errorResponses", schema: errorResponseSchema },
      { name: "process", schema: processSchema },
      { name: "processInstance", schema: processInstanceSchema },
      { name: "processInstanceDetail", schema: processInstanceDetailSchema },
      { name: "task", schema: taskSchema },
    ]),
    forwardRef(() => ItemModule),
    SubscriptionModule,
  ],
  controllers: [ProcessController],
  providers: [ProcessService],
  exports: [ProcessService],
})
export class ProcessModule {}

import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HelperModule } from "src/helper/helper.module";
import { ItemModule } from "src/item/item.module";
import { PaymentRequestModule } from "src/payment/payment-request.module";
import { SubscriptionModule } from "src/subscription/subscription.module";
import { ProcessController } from "./process.controller";
import { ProcessService } from "./process.service";
import { processSchema } from "./schema/process.schema";
import { processInstanceSchema } from "./schema/processInstance.schema";
import { processInstanceDetailSchema } from "./schema/processInstanceDetails.schema";
import { taskSchema } from "./schema/task.schema";
import { ratingSchema } from "./schema/ratings.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "process", schema: processSchema },
      { name: "processInstance", schema: processInstanceSchema },
      { name: "processInstanceDetail", schema: processInstanceDetailSchema },
      { name: "task", schema: taskSchema },
      { name: "ratings", schema: ratingSchema },
    ]),
    forwardRef(() => ItemModule),
    SubscriptionModule,
    forwardRef(() => PaymentRequestModule),
    forwardRef(() => HelperModule)
  ],
  controllers: [ProcessController],
  providers: [ProcessService],
  exports: [ProcessService],
})
export class ProcessModule { }

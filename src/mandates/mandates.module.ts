import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MandatesController } from "./mandates.controller";
import { MandatesService } from "./mandates.service";
import { Mandate, MandateSchema } from "./schema/mandates.schema";
import { MandateHistoryService } from "./mandate-history/mandate-history.service";
import {
  MandateHistory,
  MandateHistorySchema,
} from "./schema/mandates-history.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mandate.name, schema: MandateSchema },
      { name: MandateHistory.name, schema: MandateHistorySchema },
    ]),
  ],
  controllers: [MandatesController],
  providers: [MandatesService, MandateHistoryService],
  exports: [MandatesService, MandateHistoryService],
})
export class MandatesModule {}

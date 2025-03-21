import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MandatesController } from "./mandates.controller";
import { MandatesService } from "./mandates.service";
import { Mandate, MandateSchema } from "./schema/mandates.schema";
import { MandateHistoryService } from './mandate-history/mandate-history.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Mandate.name, schema: MandateSchema }]),
  ],
  controllers: [MandatesController],
  providers: [MandatesService, MandateHistoryService],
  exports: [MandatesService,MandateHistoryService],
})
export class MandatesModule {}

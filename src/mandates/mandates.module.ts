import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MandatesController } from "./mandates.controller";
import { MandatesService } from "./mandates.service";
import { Mandate, MandateSchema } from "./schema/mandates.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Mandate.name, schema: MandateSchema }]),
  ],
  controllers: [MandatesController],
  providers: [MandatesService],
  exports: [MandatesService],
})
export class MandatesModule {}

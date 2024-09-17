import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SharedModule } from "src/shared/shared.module";
import { EndorsementController } from "./endorsement.controller";
import { EndorsementService } from "./endorsement.service";
import { endorsementSchema } from "./schema/endorsement.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "endorsement", schema: endorsementSchema },
    ]),
    SharedModule,
  ],
  controllers: [EndorsementController],
  providers: [EndorsementService],
  exports: [EndorsementService],
})
export class EndorsementModule {}

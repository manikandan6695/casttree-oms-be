import { connectionRequestSchema } from "./schema/connectionRequest.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SharedModule } from "src/shared/shared.module";
import { ConnectionController } from "./connection.controller";
import { ConnectionService } from "./connection.service";
import { connectionSchema } from "./schema/connection.schema";
import { profileSchema } from "src/profile/schema/profile.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "connection", schema: connectionSchema },
      { name: "profile", schema: profileSchema },
      { name: "connectionRequest", schema: connectionRequestSchema },
    ]),
    SharedModule,
  ],
  controllers: [ConnectionController],
  providers: [ConnectionService],
  exports: [ConnectionService],
})
export class ConnectionModule {}

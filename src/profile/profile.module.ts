import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { SystemConfigurationSchema } from "src/configuration/schema/system-configuration.schema";
import { ConnectionModule } from "src/connection/connection.module";
import { EndorsementModule } from "src/endorsement/endorsement.module";
import { ProjectModule } from "src/project/project.module";
import { SharedModule } from "src/shared/shared.module";
import { UserSchema } from "src/user/schema/user.schema";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { profileSchema } from "./schema/profile.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "profile", schema: profileSchema },
      { name: "user", schema: UserSchema },
      { name: "system-config", schema: SystemConfigurationSchema },
    ]),
    SharedModule,
    AuthModule,
    ConnectionModule,
    EndorsementModule,
    ProjectModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}

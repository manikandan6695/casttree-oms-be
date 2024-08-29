import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { CtApiModule } from "src/ct-api/ct-api.module";
import { nominationsSchema } from "src/nominations/schema/nominations.schema";
import { organizationSchema } from "src/organization/schema/organization.schema";
import { SharedModule } from "src/shared/shared.module";
import { UserSchema } from "./schema/user.schema";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "user", schema: UserSchema },
      { name: "organization", schema: organizationSchema },
      { name: "nominations", schema: nominationsSchema },
    ]),
    SharedModule,
    AuthModule,
    HttpModule,
    CtApiModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

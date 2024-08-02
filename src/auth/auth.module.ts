import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { SystemConfigurationSchema } from "src/configuration/schema/system-configuration.schema";
import { SharedModule } from "src/shared/shared.module";
import { AuthService } from "./auth.service";
import { ThrottlerBehindProxyGuard } from "./guard/throttle-behind-proxy.guard";
import { JwtStrategy } from "./strategy/jwt.strategy";
@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: "system-configuration", schema: SystemConfigurationSchema },
    ]),
    SharedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
  ],
  controllers: [],
  providers: [AuthService, JwtStrategy, ThrottlerBehindProxyGuard],
  exports: [AuthService],
})
export class AuthModule {}

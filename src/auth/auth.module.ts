import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { SharedModule } from "src/shared/shared.module";
import { ThrottlerBehindProxyGuard } from "./guard/throttle-behind-proxy.guard";
import { JwtStrategy } from "./strategy/jwt.strategy";
@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature(),
    SharedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
  ],
  controllers: [],
  providers: [JwtStrategy, ThrottlerBehindProxyGuard],
})
export class AuthModule {}

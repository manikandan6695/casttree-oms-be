import { MiddlewareConsumer, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { ItemModule } from "./item/item.module";
import { HelperModule } from "./helper/helper.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SharedModule } from "./shared/shared.module";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerBehindProxyGuard } from "./auth/guard/throttle-behind-proxy.guard";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ServiceRequestModule } from "./service-request/service-request.module";
import { ServiceResponseModule } from "./service-response/service-response.module";
import { ServiceResponseFormatModule } from "./service-response-format/service-response-format.module";
import { CommentsModule } from "./comments/comments.module";
import { InvoiceModule } from "./invoice/invoice.module";
import { PaymentRequestModule } from "./payment/payment-request.module";
import { CacheModule } from "@nestjs/cache-manager";
import { GetUserOriginMiddleware } from "./helper/middleware/get-user-origin.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get("THROTTLE_TTL"),
          limit: config.get("THROTTLE_LIMIT"),
        },
      ],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        console.log("db url", config.get("DB_URL"));
        return {
          uri: config.get("DB_URL"),
        };
      },
      inject: [ConfigService],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    SharedModule,
    ItemModule,
    HelperModule,
    EventEmitterModule.forRoot(),
    ServiceRequestModule,
    ServiceResponseModule,
    ServiceResponseFormatModule,
    CommentsModule,
    PaymentRequestModule,
    InvoiceModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetUserOriginMiddleware)
      .forRoutes("/service-item");
  }
}

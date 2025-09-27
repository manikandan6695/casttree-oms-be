import { TaxModule } from "./tax/tax.module";
//import { CacheModule } from "@nestjs/cache-manager";
import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerBehindProxyGuard } from "./auth/guard/throttle-behind-proxy.guard";
import { CommentsModule } from "./comments/comments.module";
import { HelperModule } from "./helper/helper.module";
import { GetUserOriginMiddleware } from "./helper/middleware/get-user-origin.middleware";
import { InvoiceModule } from "./invoice/invoice.module";
import { ItemModule } from "./item/item.module";
import { MandatesModule } from "./mandates/mandates.module";
import { PaymentRequestModule } from "./payment/payment-request.module";
import { ProcessModule } from "./process/process.module";
import { ServiceRequestModule } from "./service-request/service-request.module";
import { ServiceResponseFormatModule } from "./service-response-format/service-response-format.module";
import { ServiceResponseModule } from "./service-response/service-response.module";
import { SharedModule } from "./shared/shared.module";
import { SubscriptionModule } from "./subscription/subscription.module";
import { RedisModule } from "./redis/redis.module";
import { DynamicUiModule } from "./dynamic-ui/dynamic-ui.module";
import { RedisInitializer } from "./redis/redis.initializer";
import { PaymentRequestService } from "./payment/payment-request.service";
import { EventOutBoxModule } from "./event-outbox/event-outbox.module";
import { LogInteceptor } from "./logger/logger.interceptor";
import { LoggerModule } from "./logger/logger.module";

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
        // console.log("db url", config.get("DB_URL"));
        return {
          uri: config.get("DB_URL"),
        };
      },
      inject: [ConfigService],
    }),
    // CacheModule.register({
    //   isGlobal: true,
    // }),
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
    ProcessModule,
    RedisModule,
    SubscriptionModule,
    ScheduleModule.forRoot(),
    MandatesModule,
    TaxModule,
    DynamicUiModule,
    EventOutBoxModule,
    RedisModule,
    LoggerModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInteceptor,
    },
    RedisInitializer,
    // AllExceptionsFilter
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetUserOriginMiddleware)
      .exclude(
        { path: "service-item/promotion-details", method: RequestMethod.GET },
        { path: "service-item/service-items", method: RequestMethod.GET }
      )
      .forRoutes("/service-item");
  }
}

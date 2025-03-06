import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerBehindProxyGuard } from "./auth/guard/throttle-behind-proxy.guard";
import { CommentsModule } from "./comments/comments.module";
import { HelperModule } from "./helper/helper.module";
import { InvoiceModule } from "./invoice/invoice.module";
import { SqlSalesDocument } from "./invoice/sqlTables/sales-document";
import { SqlItemDocument } from "./item-document/sqlTables/item-document";
import { ItemModule } from "./item/item.module";
import { PaymentRequestModule } from "./payment/payment-request.module";
import { SqlPayment } from "./payment/sqlTables/payment";
import { ProcessModule } from "./process/process.module";
import { ServiceRequestModule } from "./service-request/service-request.module";
import { SqlServiceRequest } from "./service-request/sqlTables/service-request";
import { ServiceResponseFormatModule } from "./service-response-format/service-response-format.module";
import { ServiceResponseModule } from "./service-response/service-response.module";
import { SharedModule } from "./shared/shared.module";
import { SubscriptionModule } from "./subscription/subscription.module";

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
   /* CacheModule.register({
      isGlobal: true,
    }),*/
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
    SubscriptionModule,
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'casttree-development.database.windows.net',
      port: 1433,
      username: 'casttree-dev',
      password: 'c@sttree@2025',
      database: 'casttree-development',
      entities: [SqlPayment,SqlSalesDocument,SqlItemDocument,SqlServiceRequest],
      synchronize: false,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
      extra: {
        trustServerCertificate: true,
      },
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([SqlPayment,SqlSalesDocument,SqlItemDocument,SqlServiceRequest]),
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
/* configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetUserOriginMiddleware)
      .forRoutes("/service-item");
  }*/
}

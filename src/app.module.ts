//import { CacheModule } from "@nestjs/cache-manager";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from '@nestjs/typeorm';
import { process } from 'src/process/sqlTables/process.table';
import { ThrottlerBehindProxyGuard } from "./auth/guard/throttle-behind-proxy.guard";
import { CommentsModule } from "./comments/comments.module";
import { HelperModule } from "./helper/helper.module";
import { GetUserOriginMiddleware } from "./helper/middleware/get-user-origin.middleware";
import { InvoiceModule } from "./invoice/invoice.module";
import { ItemModule } from "./item/item.module";
import { MandatesModule } from './mandates/mandates.module';
import { PaymentRequestModule } from "./payment/payment-request.module";
import { ProcessModule } from "./process/process.module";
import { processInstance } from "./process/sqlTables/processInstance.table";
import { ProcessInstanceDetail } from "./process/sqlTables/processInstanceDetail.table";
import { task } from "./process/sqlTables/task.table";
import { ServiceRequestModule } from "./service-request/service-request.module";
import { ServiceResponseFormatModule } from "./service-response-format/service-response-format.module";
import { ServiceResponseModule } from "./service-response/service-response.module";
import { SharedModule } from "./shared/shared.module";
import { Subscription } from "./subscription/sqlTable/subscription.table";
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
    ScheduleModule.forRoot(),
    MandatesModule,
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'casttree-development.database.windows.net',
      port: 1433,
      username: 'casttree-dev',
      password: 'c@sttree@2025',
      database: 'casttree-development',
      entities: [],
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
    TypeOrmModule.forFeature([processInstance, ProcessInstanceDetail, task, process,Subscription]),
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

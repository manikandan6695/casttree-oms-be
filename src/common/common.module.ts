import { Module } from "@nestjs/common";
import * as dotenv from "dotenv";
import * as path from "path";
import { HelperModule } from "./helper/helper.module";
import { PaginationModule } from "./pagination/pagination.module";
import { NovuService } from "./novu/novu.service";
import { HttpModule } from "@nestjs/axios";
import { RedisModule } from "./redis/redis.module";
import { TrinoModule } from "./database/trino/trino.module";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
console.log(JSON.stringify(process.env));

@Module({
  imports: [
    // NestVaultModule.registerAsync({
    //   endpoint: process.env.VAULT_DOMAIN ?? "https://vault1.ninjacart.in:8200",
    //   token: process.env.NC_VAULT_TOKEN,
    //   configPath:
    //     process.env.VAULT_CONFIG_PATH ??
    //     "secret/ninja-global/social-network/qa",
    //   apiVersion: "v1",
    // }),
    // MongooseModule.forRootAsync({
    //   connectionName: DATABASE_CONNECTION_NAME,
    //   imports: [DatabaseOptionsModule],
    //   inject: [DatabaseOptionsService],
    //   useFactory: (databaseOptionsService: DatabaseOptionsService) =>
    //     databaseOptionsService.createOptionsTest(),
    // }),
    HelperModule,
    PaginationModule,
    HttpModule,
    RedisModule,
    TrinoModule
  ],
  providers: [NovuService],
  exports: [NovuService],
})
export class CommonModule {}

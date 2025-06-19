import { Global, Module, OnApplicationShutdown, Scope } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ModuleRef } from "@nestjs/core";
import { Redis } from "ioredis";
import { IORedisKey } from "./redis.constants";
import { RedisService } from "./redis.service";
import { NestVaultService } from "../nest-vault/nest-vault.service";
import { RedisController } from "./redis.controller";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: IORedisKey,
      useFactory: async (configService: NestVaultService) => {
        const { connectionName, host, password, port } =
          configService.get<any>("REDIS_CONFIG");
        return new Redis({
          password: password,
          host: host,
          port: port,
          connectionName: connectionName,
        });
      },
      inject: [NestVaultService],
    },
    RedisService,
  ],
  exports: [RedisService],
  controllers: [RedisController],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const redis = this.moduleRef.get(IORedisKey);
      redis.quit();
      redis.on("end", () => {
        resolve();
      });
    });
  }
}

import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { PeertubeController } from "./peertube.controller";
import { InfraRepositories } from "./interface";
import { CommandHandlers } from "./application/command/handler";
import { CqrsModule } from "@nestjs/cqrs";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [HttpModule, CacheModule.register(), CqrsModule],
  providers: [...InfraRepositories, ...CommandHandlers],
  controllers: [PeertubeController],
  exports: [...InfraRepositories],
})
export class PeertubeModule {}

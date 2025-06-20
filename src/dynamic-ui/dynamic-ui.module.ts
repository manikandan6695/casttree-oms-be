import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { DynamicUIController } from "./dynamic-ui.controller";
import { DynamicUIRepository } from "./infra/dynamic-ui.repository";
import { GetPageConfigHandler } from "./application/query/handler/get-page-config.handler";
import { InjectionToken } from "./application/injection-token.enum";

@Module({
  imports: [CqrsModule],
  controllers: [DynamicUIController],
  providers: [
    DynamicUIRepository,
    GetPageConfigHandler,
    {
      provide: InjectionToken.DYNAMIC_UI_REPOSITORY,
      useClass: DynamicUIRepository,
    },
  ],
})
export class DynamicUIModule {}

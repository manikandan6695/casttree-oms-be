import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DynamicUIController } from "./dynamic-ui.controller";
import { FeedService } from "./feed.service";
import { AppNavBarSchema } from "./infrastructure/entity/app-navbar.schema";
import { ContentPageSchema } from "./infrastructure/entity/page.schema";
import { ComponentSchema } from "./infrastructure/entity/component.schema";
import { ComponentHandlerRegistry } from "./handlers/component-handler.registry";
import { TrendingSeriesHandler } from "./handlers/trending-series.handler";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "appNavBar", schema: AppNavBarSchema },
      { name: "contentPage", schema: ContentPageSchema },
      { name: "pageComponent", schema: ComponentSchema },
    ]),
  ],
  controllers: [DynamicUIController],
  providers: [FeedService, ComponentHandlerRegistry, TrendingSeriesHandler],
  exports: [FeedService],
})
export class FeedModule {
  constructor(
    private readonly componentHandlerRegistry: ComponentHandlerRegistry,
    private readonly trendingSeriesHandler: TrendingSeriesHandler
  ) {
    // Register component handlers
    this.componentHandlerRegistry.register(this.trendingSeriesHandler);
  }
}

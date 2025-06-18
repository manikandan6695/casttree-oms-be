import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";
import { AppNavBarSchema } from "./schema/app-navbar.schema";
import { ContentPageSchema } from "./schema/page.schema";
import { ComponentSchema } from "./schema/component.schema";
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
  controllers: [FeedController],
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

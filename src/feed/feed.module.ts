import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";
import { AppNavBarSchema } from "./schema/app-navbar.schema";
import { ContentPageSchema } from "./schema/page.schema";
import { ComponentSchema } from "./schema/component.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "appNavBar", schema: AppNavBarSchema },
      { name: "contentPage", schema: ContentPageSchema },
      { name: "pageComponent", schema: ComponentSchema },
    ]),
  ],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}

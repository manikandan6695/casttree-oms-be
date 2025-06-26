import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { serviceitemsSchema } from "src/item/schema/serviceItem.schema";
import { ProcessModule } from "src/process/process.module";
import { SystemConfigurationSchema } from "src/shared/schema/system-configuration.schema";
import { SharedModule } from "src/shared/shared.module";
import { SubscriptionModule } from "src/subscription/subscription.module";
import { DynamicUiController } from "./dynamic-ui.controller";
import { DynamicUiService } from "./dynamic-ui.service";
import { AppNavBarSchema } from "./schema/app-navbar.entity";
import { ComponentSchema } from "./schema/component.entity";
import { ContentPageSchema } from "./schema/page-content.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "appNavBar", schema: AppNavBarSchema },
      { name: "component", schema: ComponentSchema },
      { name: "contentPage", schema: ContentPageSchema },
      { name: "serviceitems", schema: serviceitemsSchema },
      { name: "systemConfiguration", schema: SystemConfigurationSchema },
    ]),
    SharedModule,
    AuthModule,
    HelperModule,
    ProcessModule,
    SubscriptionModule,
  ],
  controllers: [DynamicUiController],
  providers: [DynamicUiService],
})
export class DynamicUiModule {}

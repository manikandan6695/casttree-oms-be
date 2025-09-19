import { forwardRef, Module } from "@nestjs/common";
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
import { BannerConfigurationSchema } from "./schema/banner-configuration.schema";
import { UserFilterPreferenceSchema } from "./schema/user-filter-preference.schema";
import { FilterTypeSchema } from "./schema/filter-type.schema";
import { FilterOptionSchema } from "./schema/filter-option.schema";
import { processSchema } from "src/process/schema/process.schema";
import { categorySchema } from "./schema/category.schema";
import { AwardSchema } from "src/awards/schema/award.schema";
import { NominationSchema } from "src/nominations/schema/nomination.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "appNavBar", schema: AppNavBarSchema },
      { name: "bannerConfiguration", schema: BannerConfigurationSchema },
      { name: "component", schema: ComponentSchema },
      { name: "contentPage", schema: ContentPageSchema },
      { name: "serviceitems", schema: serviceitemsSchema },
      { name: "systemConfiguration", schema: SystemConfigurationSchema },
      { name: "userFilterPreferences", schema: UserFilterPreferenceSchema},
      { name: "filterTypes", schema: FilterTypeSchema},
      { name: "filterOptions", schema: FilterOptionSchema},
      { name: "process", schema: processSchema },
      { name: "category", schema: categorySchema },
      { name: "award", schema: AwardSchema },
      { name: "nomination", schema: NominationSchema }
    ]),
    SharedModule,
    AuthModule,
    forwardRef(() => HelperModule),
    ProcessModule,
    SubscriptionModule,
  ],
  controllers: [DynamicUiController],
  providers: [DynamicUiService],
})
export class DynamicUiModule {}

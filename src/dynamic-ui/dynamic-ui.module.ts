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
import { BannerConfigurationSchema } from "./schema/banner-configuration.schema";
import { UserFilterPreferenceSchema } from "./schema/user-filter-preference.schema";
import { FilterTypeSchema } from "./schema/filter-type.schema";
import { FilterOptionSchema } from "./schema/filter-option.schema";
import { processSchema } from "src/process/schema/process.schema";
import { categorySchema } from "./schema/category.schema";
import { ItemSchema } from "src/item/schema/item.schema";
import { LanguageSchema } from "src/shared/schema/language.schema";
import { ProfileSchema } from "src/shared/schema/profile.schema";
import { SkillsSchema } from "src/shared/schema/skills.schema";
import { RoleSchema } from "src/shared/schema/role.schema";
import { UserOrganizationSchema } from "src/shared/schema/user-organization.schema";
import { OrganizationSchema } from "src/shared/schema/organization.schema";
import { taskSchema } from "src/process/schema/task.schema";
import { mediaSchema } from "./schema/media.schema";
import { Achievement, AchievementSchema } from './schema/achievement.schema';
import { VirtualItem, VirtualItemSchema } from './schema/virtual-item.schema';
import { VirtualItemGroup, VirtualItemGroupSchema } from './schema/virtual-item-group.schema';
import { Award, AwardSchema } from './schema/awards.schema';

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
      { name: "item", schema: ItemSchema },
      { name: "language", schema: LanguageSchema },
      { name: "profile", schema: ProfileSchema },
      { name: "skills", schema: SkillsSchema },
      { name: "role", schema: RoleSchema },
      { name: "userOrganization", schema: UserOrganizationSchema },
      { name: "organization", schema: OrganizationSchema },
      { name: "task", schema: taskSchema },
      { name: "media", schema: mediaSchema },
      { name: VirtualItem.name, schema: VirtualItemSchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: VirtualItemGroup.name, schema: VirtualItemGroupSchema },
      { name: Award.name, schema: AwardSchema }
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

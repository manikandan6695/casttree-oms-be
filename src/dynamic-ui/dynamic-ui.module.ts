import { Module ,forwardRef} from "@nestjs/common";
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
import { FilterOptionSchema } from "./schema/filter-option.schema";
import { FilterTypeSchema } from "./schema/filter-type.schema";
import { categorySchema } from "./schema/category.schema";
import { RedisModule } from "src/redis/redis.module";
import { AchievementSchema } from "./schema/achievement.schema";
import { VirtualItemSchema } from "./schema/virtual-item.schema";
import { VirtualItemGroupSchema } from "./schema/virtual-item-group.schema";
import { mediaSchema } from "./schema/media.schema";
import { AwardSchema } from "./schema/awards.schema";
import { ProfileSchema } from "src/shared/schema/profile.schema";
import { UserOrganizationSchema } from "src/shared/schema/user-organization.schema";
import { OrganizationSchema } from "src/shared/schema/organization.schema";
import { ItemSchema } from "src/item/schema/item.schema";
import { processSchema } from "src/process/schema/process.schema";
import { taskSchema } from "src/process/schema/task.schema";
import { SkillsSchema } from "src/shared/schema/skill.schema";
import { RoleSchema } from "src/shared/schema/role.schema";
import { LanguageSchema } from "src/shared/schema/language.schema";
import { CurrencySchema } from "src/shared/schema/currency.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "appNavBar", schema: AppNavBarSchema },
      { name: "bannerConfiguration", schema: BannerConfigurationSchema },
      { name: "component", schema: ComponentSchema },
      { name: "contentPage", schema: ContentPageSchema },
      { name: "serviceitems", schema: serviceitemsSchema },
      { name: "systemConfiguration", schema: SystemConfigurationSchema },
      { name: "filterTypes", schema: FilterTypeSchema },
      { name: "filterOptions", schema: FilterOptionSchema },
      { name: "category", schema: categorySchema },
      { name: "achievement", schema: AchievementSchema },
      { name: "virtualItem", schema: VirtualItemSchema },
      { name: "virtualItemGroup", schema: VirtualItemGroupSchema },
      { name: "media", schema: mediaSchema },
      { name: "awards", schema: AwardSchema },
      { name: "profile", schema: ProfileSchema },
      { name: "userOrganization", schema: UserOrganizationSchema },
      { name: "organization", schema: OrganizationSchema },
      { name: "item", schema: ItemSchema },
      { name: "process", schema: processSchema },
      { name: "task", schema: taskSchema },
      { name: "skill", schema: SkillsSchema },
      { name: "role", schema: RoleSchema },
      { name: "language", schema: LanguageSchema },
      { name: "currency", schema: CurrencySchema },
    ]),
    SharedModule,
    AuthModule,
    forwardRef(() => HelperModule),
    ProcessModule,
    SubscriptionModule,
    RedisModule
  ],
  controllers: [DynamicUiController],
  providers: [DynamicUiService],
})
export class DynamicUiModule {}

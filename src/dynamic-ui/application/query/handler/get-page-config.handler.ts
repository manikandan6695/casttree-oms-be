import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetPageConfigQuery } from "../impl/get-page-config.query";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ContentPageEntity } from "../../../infrastructure/entity/page-content.entity";
import { ComponentEntity } from "../../../infrastructure/entity/component.entity";
import { ServiceItemService } from "src/item/service-item.service";
import { ProcessService } from "src/process/process.service";

@QueryHandler(GetPageConfigQuery)
@Injectable()
export class GetPageConfigHandler implements IQueryHandler<GetPageConfigQuery> {
  constructor(
    @InjectModel(ContentPageEntity.name)
    private readonly contentPageModel: Model<ContentPageEntity>,
    @InjectModel(ComponentEntity.name)
    private readonly componentModel: Model<ComponentEntity>,
    private readonly serviceItemService: ServiceItemService,
    private readonly processService: ProcessService
  ) {}

  async execute(query: GetPageConfigQuery) {
    // 1. Fetch the page and populate components
    const page = await this.contentPageModel
      .findOne({ key: query.pageKey })
      .populate("components.componentId")
      .lean();

    if (!page) {
      return null;
    }

    // 2. Iterate and resolve dynamic data for each component
    const componentsWithData = await Promise.all(
      (page.components || []).map(async (compRef: any) => {
        const component = compRef.componentId;
        if (!component) return null;

        // Clone the component to avoid mutating the DB object
        const compResult = { ...component };

        if (component.type === "dynamic") {
          if (component.componentKey === "continue-watching") {
            // Fetch continue-watching data
            compResult.actionData =
              await this.processService.getContinueWatchingData(query.userId);
          } else if (
            [
              "course-series-card",
              "upcomming-series-card",
              "advertisement-feature-banner",
              "single-ad-banner",
              "full-size-banner",
              // ...add other service item keys as needed
            ].includes(component.componentKey)
          ) {
            // Fetch service item data
            compResult.actionData =
              await this.serviceItemService.getComponentData(
                component.componentKey,
                query.userId
              );
          }
        }
        // For static or other types, just return as is (actionData may be empty)
        return compResult;
      })
    );

    // 3. Assemble the final response
    return {
      _id: page._id,
      pageName: page.pageName,
      key: page.key,
      components: componentsWithData.filter(Boolean),
      bgColorCode: page.bgColorCode,
      status: page.status,
      metaData: page.metaData,
    };
  }
}

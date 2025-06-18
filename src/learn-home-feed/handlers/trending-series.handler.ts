import { Injectable } from "@nestjs/common";
import { BaseComponentHandler } from "./base-component.handler";
import { IComponent } from "../schema/component.schema";
import { IContentPage } from "../schema/page.schema";

@Injectable()
export class TrendingSeriesHandler extends BaseComponentHandler {
  readonly componentKey = "trendingSeries";

  async handle(component: IComponent, page: IContentPage): Promise<any> {
    this.validateComponent(component);

    // Implement trending series specific logic here
    return {
      type: "carousel",
      title: component.title,
      subtitle: component.subtitle,
      displayType: component.displayType,
      order: component.order,
      metaData: component.metaData,
      navigation: component.navigation,
      media: component.media,
    };
  }
}

import { IComponent } from "../infrastructure/entity/component.schema";
import { IContentPage } from "../infrastructure/entity/page.schema";

export interface IComponentHandler {
  readonly componentKey: string;
  handle(component: IComponent, page: IContentPage): Promise<any>;
}

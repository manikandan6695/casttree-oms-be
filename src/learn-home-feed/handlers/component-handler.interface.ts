import { IComponent } from "../schema/component.schema";
import { IContentPage } from "../schema/page.schema";

export interface IComponentHandler {
  readonly componentKey: string;
  handle(component: IComponent, page: IContentPage): Promise<any>;
}

import { IComponent } from "../schema/component.schema";
import { IContentPage } from "../schema/page.schema";
import { IComponentHandler } from "./component-handler.interface";

export abstract class BaseComponentHandler implements IComponentHandler {
  abstract readonly componentKey: string;

  abstract handle(component: IComponent, page: IContentPage): Promise<any>;

  protected validateComponent(component: IComponent) {
    if (component.componentKey !== this.componentKey) {
      throw new Error(
        `Invalid component key. Expected ${this.componentKey}, got ${component.componentKey}`
      );
    }
  }
}

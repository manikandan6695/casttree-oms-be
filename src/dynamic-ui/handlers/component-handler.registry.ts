import { Injectable } from "@nestjs/common";
import { IComponentHandler } from "./component-handler.interface";

@Injectable()
export class ComponentHandlerRegistry {
  private handlers: Map<string, IComponentHandler> = new Map();

  register(handler: IComponentHandler) {
    this.handlers.set(handler.componentKey, handler);
  }

  getHandler(componentKey: string): IComponentHandler {
    const handler = this.handlers.get(componentKey);
    if (!handler) {
      throw new Error(`No handler found for component key: ${componentKey}`);
    }
    return handler;
  }
}

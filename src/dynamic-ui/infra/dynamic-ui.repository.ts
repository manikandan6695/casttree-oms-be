import { Injectable } from "@nestjs/common";
import { IDynamicUIRepository } from "../interface/idynamic-ui.repository";

@Injectable()
export class DynamicUIRepository implements IDynamicUIRepository {
  async getPageConfig(pageKey: string): Promise<any> {
    // Fetch from DB or config service
    return { pageKey, layout: "vertical", components: ["hero", "list"] };
  }
  async getComponentConfig(componentKey: string): Promise<any> {
    // Fetch from DB or config service
    return { componentKey, type: "list", data: [] };
  }
}

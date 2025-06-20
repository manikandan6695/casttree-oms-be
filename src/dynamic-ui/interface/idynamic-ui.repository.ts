export interface IDynamicUIRepository {
  getPageConfig(pageKey: string): Promise<any>;
  getComponentConfig(componentKey: string): Promise<any>;
}

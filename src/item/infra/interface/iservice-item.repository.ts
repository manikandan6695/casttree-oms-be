export interface IServiceItemRepository {
  findById(id: string): Promise<any>;
  findAll(
    query: any,
    skip: number,
    limit: number,
    countryCode?: string
  ): Promise<any[]>;
  findByProcessId(processId: string | string[], userId?: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, update: any): Promise<any>;
  delete(id: string): Promise<any>;
  findDetails(id: string, countryCode?: string, userId?: string): Promise<any>;
  findWorkshopItems(
    filter: any,
    skip: number,
    limit: number,
    userId?: string,
    countryCode?: string
  ): Promise<any>;
  findWorkshopItemDetails(
    id: string,
    userId?: string,
    countryCode?: string
  ): Promise<any>;
  findProcessHomeScreenData(userId: string): Promise<any>;
  findCourseHomeScreenData(userId: string): Promise<any>;
  findPlanDetails(
    processId: string,
    countryCode?: string,
    userId?: string
  ): Promise<any>;
  findPromotionDetails(
    processId: string,
    countryCode?: string,
    userId?: string
  ): Promise<any>;
  findPremiumDetails(countryCode?: string, userId?: string): Promise<any>;
  findSubscriptionPlanDetails(
    countryCode?: string,
    userId?: string
  ): Promise<any>;
  findMentorUserIds(processIds: string[] | string): Promise<any>;
  findUpdatePrice(countryCode: string, itemIds: string[]): Promise<any>;
  findServiceItemType(itemId: string): Promise<any>;
  findByFilter(filter: any): Promise<any>;
  findServiceDueDate(itemId: string, userId: string): Promise<any>;
  findLanguages(itemId: string): Promise<any>;
  findPriceListItems(itemIds: string[], countryCode: string): Promise<any>;
  // Add more methods as needed
}

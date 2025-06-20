import { FilterItemRequestDTO } from "../interface/dto/filter-item.dto";
import { EserviceItemType } from "../interface/enums/serviceItem.type.enum";

export class GetServiceItemDetailQuery {
  constructor(public readonly itemId: string) {}
}

export class GetServiceItemDetailByProcessIdQuery {
  constructor(
    public readonly processId: string | string[],
    public readonly userId?: string
  ) {}
}

export class GetServiceItemsQuery {
  constructor(
    public readonly filter: any,
    public readonly skip: number = 0,
    public readonly limit: number = 20,
    public readonly countryCode?: string
  ) {}
}

export class CreateServiceItemCommand {
  constructor(public readonly data: any) {}
}

export class UpdateServiceItemCommand {
  constructor(
    public readonly id: string,
    public readonly update: any
  ) {}
}

export class DeleteServiceItemCommand {
  constructor(public readonly id: string) {}
}

export class GetServiceItemDetailsQuery {
  constructor(
    public readonly id: string,
    public readonly countryCode?: string,
    public readonly userId?: string
  ) {}
}

export class GetWorkshopServiceItemsQuery {
  constructor(
    public readonly filter: any,
    public readonly skip: number = 0,
    public readonly limit: number = 20,
    public readonly userId?: string,
    public readonly countryCode?: string
  ) {}
}

export class GetWorkshopServiceItemDetailsQuery {
  constructor(
    public readonly id: string,
    public readonly userId?: string,
    public readonly countryCode?: string
  ) {}
}

export class GetProcessHomeScreenDataQuery {
  constructor(public readonly userId: string) {}
}

export class GetCourseHomeScreenDataQuery {
  constructor(public readonly userId: string) {}
}

export class GetPlanDetailsQuery {
  constructor(
    public readonly processId: string,
    public readonly countryCode?: string,
    public readonly userId?: string
  ) {}
}

export class GetPromotionDetailsQuery {
  constructor(
    public readonly processId: string,
    public readonly countryCode?: string,
    public readonly userId?: string
  ) {}
}

export class GetPremiumDetailsQuery {
  constructor(
    public readonly countryCode?: string,
    public readonly userId?: string
  ) {}
}

export class GetSubscriptionPlanDetailsQuery {
  constructor(
    public readonly countryCode?: string,
    public readonly userId?: string
  ) {}
}

export class GetMentorUserIdsQuery {
  constructor(public readonly processIds: string[] | string) {}
}

export class GetUpdatePriceQuery {
  constructor(
    public readonly countryCode: string,
    public readonly itemIds: string[]
  ) {}
}

export class GetServiceItemTypeQuery {
  constructor(public readonly itemId: string) {}
}

export class GetServiceItemByFilterQuery {
  constructor(public readonly filter: any) {}
}

export class GetServiceDueDateQuery {
  constructor(
    public readonly itemId: string,
    public readonly userId: string
  ) {}
}

export class GetLanguagesQuery {
  constructor(public readonly itemId: string) {}
}

export class GetPriceListItemsQuery {
  constructor(
    public readonly itemIds: string[],
    public readonly countryCode: string
  ) {}
}

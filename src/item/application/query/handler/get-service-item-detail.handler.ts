import {
  IQueryHandler,
  QueryHandler,
  ICommandHandler,
  CommandHandler,
} from "@nestjs/cqrs";
import {
  GetServiceItemDetailQuery,
  GetServiceItemDetailByProcessIdQuery,
  GetServiceItemsQuery,
  CreateServiceItemCommand,
  UpdateServiceItemCommand,
  DeleteServiceItemCommand,
  GetServiceItemDetailsQuery,
  GetWorkshopServiceItemsQuery,
  GetWorkshopServiceItemDetailsQuery,
  GetProcessHomeScreenDataQuery,
  GetCourseHomeScreenDataQuery,
  GetPlanDetailsQuery,
  GetPromotionDetailsQuery,
  GetPremiumDetailsQuery,
  GetSubscriptionPlanDetailsQuery,
  GetMentorUserIdsQuery,
  GetUpdatePriceQuery,
  GetServiceItemTypeQuery,
  GetServiceItemByFilterQuery,
  GetServiceDueDateQuery,
  GetLanguagesQuery,
  GetPriceListItemsQuery,
} from "../impl/get-service-item-detail.query";
import { Inject } from "@nestjs/common";
import { IServiceItemRepository } from "src/item/infra/interface/iservice-item.repository";
import { HelperService } from "src/helper/helper.service";
import { ProcessService } from "src/process/process.service";
import { EprofileType } from "src/item/enum/profileType.enum";

@QueryHandler(GetServiceItemDetailQuery)
export class GetServiceItemDetailHandler
  implements IQueryHandler<GetServiceItemDetailQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}

  async execute(query: GetServiceItemDetailQuery) {
    return this.repo.findById(query.itemId);
  }
}

@QueryHandler(GetServiceItemDetailByProcessIdQuery)
export class GetServiceItemDetailByProcessIdHandler
  implements IQueryHandler<GetServiceItemDetailByProcessIdQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository,
    private readonly helperService: HelperService,
    private readonly processService: ProcessService
  ) {}

  async execute(query: GetServiceItemDetailByProcessIdQuery) {
    let data = await this.repo.findByProcessId(query.processId, query.userId);
    if (Array.isArray(query.processId) && Array.isArray(data)) {
      const userIds = data.map((e) => e.userId);
      const profileInfo = await this.helperService.getProfileByIdTl(
        userIds,
        EprofileType.Expert
      );
      const userProfileInfo = profileInfo.reduce((a, c) => {
        a[c.userId] = c;
        return a;
      }, {});
      let firstTasks = await this.processService.getFirstTask(
        query.processId,
        query.userId
      );
      const firstTaskObject = firstTasks.reduce((a, c) => {
        a[c.processId] = c;
        return a;
      }, {});
      for (let i = 0; i < data.length; i++) {
        data[i]["displayName"] =
          userProfileInfo[data[i]["userId"]]?.displayName;
        data[i]["itemDescription"] = data[i]["itemId"]?.itemDescription;
        data[i]["itemId"] = data[i]["itemId"]?.itemName;
        data[i]["taskData"] =
          firstTaskObject[data[i]["additionalDetails"]["processId"]];
      }
    }
    return data;
  }
}

@QueryHandler(GetServiceItemsQuery)
export class GetServiceItemsHandler
  implements IQueryHandler<GetServiceItemsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}

  async execute(query: GetServiceItemsQuery) {
    return this.repo.findAll(
      query.filter,
      query.skip,
      query.limit,
      query.countryCode
    );
  }
}

@CommandHandler(CreateServiceItemCommand)
export class CreateServiceItemHandler
  implements ICommandHandler<CreateServiceItemCommand>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}

  async execute(command: CreateServiceItemCommand) {
    return this.repo.create(command.data);
  }
}

@CommandHandler(UpdateServiceItemCommand)
export class UpdateServiceItemHandler
  implements ICommandHandler<UpdateServiceItemCommand>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}

  async execute(command: UpdateServiceItemCommand) {
    return this.repo.update(command.id, command.update);
  }
}

@CommandHandler(DeleteServiceItemCommand)
export class DeleteServiceItemHandler
  implements ICommandHandler<DeleteServiceItemCommand>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}

  async execute(command: DeleteServiceItemCommand) {
    return this.repo.delete(command.id);
  }
}

@QueryHandler(GetServiceItemDetailsQuery)
export class GetServiceItemDetailsHandler
  implements IQueryHandler<GetServiceItemDetailsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetServiceItemDetailsQuery) {
    return this.repo.findDetails(query.id, query.countryCode, query.userId);
  }
}

@QueryHandler(GetWorkshopServiceItemsQuery)
export class GetWorkshopServiceItemsHandler
  implements IQueryHandler<GetWorkshopServiceItemsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetWorkshopServiceItemsQuery) {
    return this.repo.findWorkshopItems(
      query.filter,
      query.skip,
      query.limit,
      query.userId,
      query.countryCode
    );
  }
}

@QueryHandler(GetWorkshopServiceItemDetailsQuery)
export class GetWorkshopServiceItemDetailsHandler
  implements IQueryHandler<GetWorkshopServiceItemDetailsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetWorkshopServiceItemDetailsQuery) {
    return this.repo.findWorkshopItemDetails(
      query.id,
      query.userId,
      query.countryCode
    );
  }
}

@QueryHandler(GetProcessHomeScreenDataQuery)
export class GetProcessHomeScreenDataHandler
  implements IQueryHandler<GetProcessHomeScreenDataQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetProcessHomeScreenDataQuery) {
    return this.repo.findProcessHomeScreenData(query.userId);
  }
}

@QueryHandler(GetCourseHomeScreenDataQuery)
export class GetCourseHomeScreenDataHandler
  implements IQueryHandler<GetCourseHomeScreenDataQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetCourseHomeScreenDataQuery) {
    return this.repo.findCourseHomeScreenData(query.userId);
  }
}

@QueryHandler(GetPlanDetailsQuery)
export class GetPlanDetailsHandler
  implements IQueryHandler<GetPlanDetailsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetPlanDetailsQuery) {
    return this.repo.findPlanDetails(
      query.processId,
      query.countryCode,
      query.userId
    );
  }
}

@QueryHandler(GetPromotionDetailsQuery)
export class GetPromotionDetailsHandler
  implements IQueryHandler<GetPromotionDetailsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetPromotionDetailsQuery) {
    return this.repo.findPromotionDetails(
      query.processId,
      query.countryCode,
      query.userId
    );
  }
}

@QueryHandler(GetPremiumDetailsQuery)
export class GetPremiumDetailsHandler
  implements IQueryHandler<GetPremiumDetailsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetPremiumDetailsQuery) {
    return this.repo.findPremiumDetails(query.countryCode, query.userId);
  }
}

@QueryHandler(GetSubscriptionPlanDetailsQuery)
export class GetSubscriptionPlanDetailsHandler
  implements IQueryHandler<GetSubscriptionPlanDetailsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetSubscriptionPlanDetailsQuery) {
    return this.repo.findSubscriptionPlanDetails(
      query.countryCode,
      query.userId
    );
  }
}

@QueryHandler(GetMentorUserIdsQuery)
export class GetMentorUserIdsHandler
  implements IQueryHandler<GetMentorUserIdsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetMentorUserIdsQuery) {
    return this.repo.findMentorUserIds(query.processIds);
  }
}

@QueryHandler(GetUpdatePriceQuery)
export class GetUpdatePriceHandler
  implements IQueryHandler<GetUpdatePriceQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetUpdatePriceQuery) {
    return this.repo.findUpdatePrice(query.countryCode, query.itemIds);
  }
}

@QueryHandler(GetServiceItemTypeQuery)
export class GetServiceItemTypeHandler
  implements IQueryHandler<GetServiceItemTypeQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetServiceItemTypeQuery) {
    return this.repo.findServiceItemType(query.itemId);
  }
}

@QueryHandler(GetServiceItemByFilterQuery)
export class GetServiceItemByFilterHandler
  implements IQueryHandler<GetServiceItemByFilterQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetServiceItemByFilterQuery) {
    return this.repo.findByFilter(query.filter);
  }
}

@QueryHandler(GetServiceDueDateQuery)
export class GetServiceDueDateHandler
  implements IQueryHandler<GetServiceDueDateQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetServiceDueDateQuery) {
    return this.repo.findServiceDueDate(query.itemId, query.userId);
  }
}

@QueryHandler(GetLanguagesQuery)
export class GetLanguagesHandler implements IQueryHandler<GetLanguagesQuery> {
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetLanguagesQuery) {
    return this.repo.findLanguages(query.itemId);
  }
}

@QueryHandler(GetPriceListItemsQuery)
export class GetPriceListItemsHandler
  implements IQueryHandler<GetPriceListItemsQuery>
{
  constructor(
    @Inject("IServiceItemRepository")
    private readonly repo: IServiceItemRepository
  ) {}
  async execute(query: GetPriceListItemsQuery) {
    return this.repo.findPriceListItems(query.itemIds, query.countryCode);
  }
}

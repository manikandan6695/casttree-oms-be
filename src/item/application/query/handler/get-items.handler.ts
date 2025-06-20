import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetItemsQuery } from "../impl/get-items.query";
import { Inject } from "@nestjs/common";
import { ItemInjectionToken } from "../../injection-token.enum";
import { IItemRepository } from "../../../infra/interface/iitem.repository";

@QueryHandler(GetItemsQuery)
export class GetItemsHandler implements IQueryHandler<GetItemsQuery> {
  constructor(
    @Inject(ItemInjectionToken.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository
  ) {}

  async execute(query: GetItemsQuery): Promise<any> {
    return this.itemRepository.findAll(query.query, query.skip, query.limit);
  }
}

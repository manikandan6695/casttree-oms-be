import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetItemDetailQuery } from "../impl/get-item-detail.query";
import { Inject } from "@nestjs/common";
import { ItemInjectionToken } from "../../injection-token.enum";
import { IItemRepository } from "../../../infra/interface/iitem.repository";

@QueryHandler(GetItemDetailQuery)
export class GetItemDetailHandler implements IQueryHandler<GetItemDetailQuery> {
  constructor(
    @Inject(ItemInjectionToken.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository
  ) {}

  async execute(query: GetItemDetailQuery): Promise<any> {
    return this.itemRepository.findById(query.id);
  }
}

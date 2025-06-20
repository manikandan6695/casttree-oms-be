import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetNavBarDetailsQuery } from "../impl/get-navbar-details.query";
import { Inject } from "@nestjs/common";
import { InjectionToken } from "../../injection-token.enum";
import { IDynamicUIRepository } from "../../../interface/idynamic-ui.repository";

@QueryHandler(GetNavBarDetailsQuery)
export class GetNavBarDetailsHandler
  implements IQueryHandler<GetNavBarDetailsQuery>
{
  constructor(
    @Inject(InjectionToken.DYNAMIC_UI_REPOSITORY)
    private readonly repo: IDynamicUIRepository
  ) {}

  async execute(query: GetNavBarDetailsQuery) {
    return this.repo.getNavBarDetails(query.userId);
  }
}

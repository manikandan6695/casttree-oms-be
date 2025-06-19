import { learnHomeFeedTokens } from "../../../application/dynamicUIInjectionToken";
import { FindPageByIdQuery } from "../impl/FindPageByIdQuery.command";
import { Inject, NotFoundException } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { ResponseDefaultSerialization } from "../../../../common/constants/response.default.serialization";
import { ResponseDescription } from "../../../../common/constants/response.descriptor";
import { ILearnHomeFeedQuery } from "src/dynamic-ui/interface/learn-home-feed.interface";
import { FindPageByIdResult } from "../impl/FindPageByResult.result";

@QueryHandler(FindPageByIdQuery)
export class FindPageByIdHandler
  implements IQueryHandler<FindPageByIdQuery, ResponseDefaultSerialization>
{
  @Inject(learnHomeFeedTokens.LEARN_HOME_FEED_DATA_QUERY)
  readonly learnHomeFeedQuery: ILearnHomeFeedQuery;

  async execute(
    query: FindPageByIdQuery
  ): Promise<ResponseDefaultSerialization> {
    const data = await this.learnHomeFeedQuery.findPageById(query.id);
    if (!data) throw new NotFoundException(ResponseDescription.NOT_FOUND);
    const DiscoveryMetaDataListResponseData: ResponseDefaultSerialization = {
      statusCode: 200,
      message: "success",
      ...(<FindPageByIdResult>data),
    };

    return DiscoveryMetaDataListResponseData;
  }
}

import { FindPageByIdResult } from "../infrastructure/query/impl/FindPageByResult.result";
export interface ILearnHomeFeedQuery {
  findPageById: (id: string) => Promise<FindPageByIdResult | null>;
}

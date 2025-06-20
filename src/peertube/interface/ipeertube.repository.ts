import { DataResponse } from "../infra/interface/runner-job.response";
import { PeertubeVideoResponse } from "../infra/interface/video-detail.response";

export interface RunnerJobDTO {
  start: number;
  limit: number;
  sort?: string;
  stateOneOf: number[];
}

export interface IPeertubeRepository {
  getRunnerJob(data: RunnerJobDTO): Promise<DataResponse>;
  getVideoDetail(videoId: string): Promise<PeertubeVideoResponse>;
  getVideoURLByEmbeddedURL(embeddedURL: string): Promise<string>;
}

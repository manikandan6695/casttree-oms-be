import { EInjectionToken } from "../application/injection-token.enum";
import { PeertubeRepository } from "../infra/peertube.repository";

export const InfraRepositories = [
  {
    provide: EInjectionToken.PEERTUBE_REPOSITORY,
    useClass: PeertubeRepository,
  },
];

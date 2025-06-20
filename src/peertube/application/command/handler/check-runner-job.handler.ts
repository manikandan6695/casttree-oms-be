import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { HttpException, HttpStatus, Inject } from "@nestjs/common";
import { CheckPeertubeRunnerJobCommand } from "../impl/check-runner-job.command";
import { IPeertubeRepository } from "src/peertube/interface/ipeertube.repository";
import { ILogger } from "src/logger/interface/logger.interface";
import { EInjectionToken } from "../../injection-token.enum";
import { ELoggerInjectionToken } from "src/logger/application/inject-token.enum";

@CommandHandler(CheckPeertubeRunnerJobCommand)
export class CheckPeertubeRunnerJobHandler
  implements ICommandHandler<CheckPeertubeRunnerJobCommand>
{
  constructor(
    @Inject(EInjectionToken.PEERTUBE_REPOSITORY)
    private peertubeRepository: IPeertubeRepository,
    @Inject(ELoggerInjectionToken.LOGGER)
    private logger: ILogger
  ) {}
  async execute(): Promise<any> {
    try {
      const response = await this.peertubeRepository.getRunnerJob({
        start: 0,
        limit: 100,
        sort: "-createdAt",
        stateOneOf: [1, 2, 5],
      });
      let failedCase = 0;
      response.data.filter((record) => {
        // In case job not started proceesing & if the createdat date croosed 1 hour then 
        // alert has to be triggered
        if (Date.now() - new Date(record.createdAt).getTime() > 10800000) {
          failedCase++;
        }
      });
      const message =
        failedCase > 0
          ? "!!Important job are not getting processed"
          : "No issues runner jobs are fine";
      this.logger.log(message, this.constructor.name);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}

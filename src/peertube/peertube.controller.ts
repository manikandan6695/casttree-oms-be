import { Controller, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { CheckPeertubeRunnerJobCommand } from "./application/command/impl/check-runner-job.command";

@Controller({ path: "peertube", version: "2" })
export class PeertubeController {
  constructor(private commandBus: CommandBus) {}

  @Post("/runner/job/check")
  checkPeertubeRunnerJob() {
    return this.commandBus.execute(new CheckPeertubeRunnerJobCommand());
  }
}

import { ThrottlerGuard } from "@nestjs/throttler";
import { Injectable } from "@nestjs/common";
import { CustomLogger } from "src/logger/customlogger.service";

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  //   protected getTracker(req: Record<string, any>): string {
  //     return req.ips.length ? req.ips[0] : req.ip; // individualize IP extraction to meet your own needs
  //   }
}

import { Controller, Get } from "@nestjs/common";
import { TimezoneService } from "./timezone.service";

@Controller("timezone")
export class TimezoneController {
  constructor(private timezone_service: TimezoneService) {}
  @Get()
  getTimeZones() {
    return this.timezone_service.getTimeZones();
  }
}

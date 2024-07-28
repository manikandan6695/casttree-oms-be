import { Controller, Get } from "@nestjs/common";
import { DateFormatService } from "./date-format.service";

@Controller("date-format")
export class DateFormatController {
  constructor(private date_format_service: DateFormatService) {}
  @Get()
  getDateFormat() {
    return this.date_format_service.getDateFormat();
  }
}

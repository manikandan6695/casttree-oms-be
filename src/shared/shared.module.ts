import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { LoggerModule } from "src/logger/logger.module";
import { CurrencyController } from "./currency/currency.controller";
import { CurrencyService } from "./currency/currency.service";
import { CitySchema } from "./schema/city.schema";
import { CommandSourceSchema } from "./schema/command-source.schema";
import { CountrySchema } from "./schema/country.schema";
import { CurrencySchema } from "./schema/currency.schema";
import { DateFormatSchema } from "./schema/date-format.schema";
import { LanguageSchema } from "./schema/language.schema";
import { SequenceSchema } from "./schema/sequence.schema";
import { StateSchema } from "./schema/state.schema";
import { TimeZoneSchema } from "./schema/time-zone.schema";
import { SharedService } from "./shared.service";
import { MailService } from "./mail.service";
@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([
      { name: "sequence", schema: SequenceSchema },
      { name: "currency", schema: CurrencySchema },
      { name: "country", schema: CountrySchema },
      { name: "state", schema: StateSchema },
      { name: "city", schema: CitySchema },
      { name: "language", schema: LanguageSchema },
      { name: "timeZone", schema: TimeZoneSchema },
      { name: "date-format", schema: DateFormatSchema },
      { name: "commandSource", schema: CommandSourceSchema },
    ]),
  ],
  providers: [SharedService, CurrencyService, ConfigService,MailService],
  exports: [SharedService, CurrencyService,MailService],
  controllers: [CurrencyController],
})
export class SharedModule {}

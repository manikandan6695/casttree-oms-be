import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { LoggerModule } from "src/logger/logger.module";
import { CityController } from "./city/city.controller";
import { CityService } from "./city/city.service";
import { CountryController } from "./country/country.controller";
import { CountryService } from "./country/country.service";
import { CurrencyController } from "./currency/currency.controller";
import { CurrencyService } from "./currency/currency.service";
import { DateFormatController } from "./date-format/date-format.controller";
import { DateFormatService } from "./date-format/date-format.service";
import { GlobalController } from "./global/global.controller";
import { GlobalService } from "./global/global.service";
import { LanguageController } from "./language/language.controller";
import { LanguageService } from "./language/language.service";
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
import { StateController } from "./state/state.controller";
import { StateService } from "./state/state.service";
import { TimezoneController } from "./timezone/timezone.controller";
import { TimezoneService } from "./timezone/timezone.service";
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
  providers: [
    SharedService,
    CountryService,
    StateService,
    CityService,
    CurrencyService,
    LanguageService,
    TimezoneService,
    DateFormatService,
    GlobalService,
    ConfigService,
  ],
  exports: [
    SharedService,
    CurrencyService,
    TimezoneService,
    DateFormatService,
    StateService,
  ],
  controllers: [
    CountryController,
    StateController,
    CityController,
    CurrencyController,
    LanguageController,
    TimezoneController,
    DateFormatController,
    GlobalController,
  ],
})
export class SharedModule {}

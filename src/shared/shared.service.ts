import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CustomLogger } from "src/logger/customlogger.service";
import { AppException } from "./app-exception";
import { CurrencyService } from "./currency/currency.service";
import {
  ECommandProcessingStatus,
  ECommandType,
} from "./enum/command-source.enum";
import { ICommandSourceModel } from "./schema/command-source.schema";
import { ISequence } from "./schema/sequence.schema";
import { Request } from "express";
var TinyURL = require("tinyurl");
var aes256 = require("aes256");
// import { REQUEST } from "@nestjs/core";
// import { MailService } from "./mail.service";
@Injectable()
export class SharedService {
  defaultLanguage = "en";
  defaultExtension = "+91";
  // options can be passed, e.g. {allErrors: true}
  schemas = {};
  constructor(
    private logger: CustomLogger,
    @InjectModel("sequence") private Sequence: Model<ISequence>,
    @InjectModel("commandSource")
    private readonly commandSourceModel: Model<ICommandSourceModel>,
    private config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private currency_service: CurrencyService,
    // @Inject(REQUEST) private request: Request,
    // private mailService: MailService,
  ) {}

  fetchName(nameArr, lang) {
    try {
      if (!nameArr || nameArr.length <= 0) {
        return;
      }

      let name = nameArr.find((el) => {
        if (el.language === lang) return el;
      })?.description;

      return name || "";
    } catch (err) {
      throw err;
    }
  }

  async createSequence(tenant: number, name: string, defaultValue: number) {
    await this.Sequence.create({ tenant, name, value: defaultValue });
  }

  async getNextNumber(
    sequenceName: string,
    prefix: string = null,
    length: number = null,
    transaction_series_id: string = null
  ): Promise<string> {
    let seq = await this.Sequence.findOneAndUpdate(
      {
        name: sequenceName,
        transaction_series_id: transaction_series_id,
        prefix: prefix,
        length: length,
      },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    let return_value = `${seq.value}`;
    if (length) {
      return_value = `${seq.value}`.padStart(length, "0");
    }
    if (prefix) {
      return_value = `${prefix}${return_value}`;
    }
    return return_value;
  }
  async updateEventProcessingStatus(
    commandSource: ICommandSourceModel,
    status: ECommandProcessingStatus
  ) {
    commandSource.status = status;
    await commandSource.save();
  }
  async trackAndEmitEvent(
    eventName: string,
    event: unknown,
    isAsync: boolean = true,
    userDetails: any
  ) {
    try {
    //  console.log("inside track and emit event");

      const commandSource = {
        userId: userDetails?.userId,
        resourceUri: userDetails?.resourceUri,
        aggregateId: null,
        action: userDetails?.action,
        type: ECommandType.Event,
        commandData: event,
        aggregateType: eventName,
        isCompositeIndex: false,
        status: ECommandProcessingStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const commandSourceCreate =
        await this.commandSourceModel.create(commandSource);
   //   console.log("commandSourceCreate", commandSourceCreate);

      event["commandSource"] = commandSourceCreate;
      if (isAsync) {
        await this.eventEmitter.emitAsync(eventName, event);
        return;
      }

      this.eventEmitter.emitAsync(eventName, event);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

 
  processError(err: Error, context: string) {
    let code: HttpStatus, response;
    if (err instanceof AppException) {
      code = err.getCode();
      response = { code, message: err.getMessage() };
    } else {
      if (err.name == "MongoError") {
        if (err["code"] == 11000) {
          let prop = "Value";
          try {
            prop = err.message.split(":")[2].replace(" dup key", "").trim();
          } catch (properr) {
         //   console.log("cant get prop");
          }
          code = HttpStatus.NOT_ACCEPTABLE;
          response = { code, message: `${prop} provided already exist` };
        } else {
          code = HttpStatus.INTERNAL_SERVER_ERROR;
          response = { code, message: err.message };
        }
      } else {
        code = HttpStatus.INTERNAL_SERVER_ERROR;
        response = { code, message: err.message };
      }
    }
    console.log("going to process err", err.stack);
    this.logger.error(err, { label: context || "Shared Module" });
    return { code, response };
  }


  mediaMapping(data, media, media_details, delete_key: string = null) {
    data.forEach((ele) => {
      this.accessByString(ele, media).forEach((m) => {
        let data = this.accessByString(ele, media_details).find(
          (x) => x._id.toString() == m.media_id.toString()
        );
        m["location"] = data?.location;
        m["meta"] = {
          media_type: data?.media_type,
          media_format: data?.media_format,
          media_size: data?.media_size,
          file_name: data?.file_name,
        };
      });
      if (delete_key) delete ele[delete_key];
    });
    return data;
  }
  accessByString(o, s) {
    s = s.replace(/\[(\w+)\]/g, ".$1"); // convert indexes to properties
    s = s.replace(/^\./, ""); // strip a leading dot
    var a = s.split(".");
    for (var i = 0, n = a.length; i < n; ++i) {
      var k = a[i];
      if (k in o) {
        o = o[k];
      } else {
        return;
      }
    }
    return o;
  }

  getFutureDateISO(days) {
    // console.log("days is", typeof days);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString();
  }

  getFutureYearISO(years) {
    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() + years);
    return currentDate.toISOString();
  }

  getFutureMonthISO(month) {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + month);
    return currentDate.toISOString();
  }

  formatText(input_string: string, linkby: string) {
    input_string = input_string.replace(/[^a-zA-Z0-9 ]/g, linkby);
    let formatted_arr = input_string.split(" ").map((character) => {
      return character.toLowerCase();
    });
    let formatted_string = formatted_arr.join(linkby);
    return formatted_string;
  }

  getDateRange(type: app_date_ranges) {
    try {
      let startdate;
      let enddate;
      let n = new Date();
      let fy = n.getFullYear();
      let mn = n.getMonth();
      let dt = n.getDate();
      switch (type) {
        case "this_month":
          startdate = new Date(fy, mn, 1, 0, 0, 0);
          enddate = new Date(fy, mn + 1, -1, 23, 59, 0);
          break;
        case "this_week":
          startdate = new Date(fy, mn, dt - 7, 0, 0, 0);
          enddate = n;
          break;
        case "yesterday":
          startdate = new Date(fy, mn, dt - 1, 0, 0, 0);
          enddate = new Date(fy, mn, dt - 1, 23, 59, 0);
          break;
        case "today":
          startdate = new Date(fy, mn, dt, 0, 0, 0);
          enddate = new Date(fy, mn, dt, 23, 59, 0);
          break;
        case "last_six_months":
          startdate = new Date(fy, mn - 5, 1, 0, 0, 0);
          enddate = new Date(fy, mn + 1, -1, 23, 59, 0);
          break;
        case "last_twelve_months":
          startdate = new Date(fy, mn - 11, 1, 0, 0, 0);
          enddate = new Date(fy, mn + 1, -1, 23, 59, 0);
          break;
        default:
          break;
      }
      return { startdate, enddate };
    } catch (err) {
      throw err;
    }
  }

  async currencyFormatter(currency_amount: number, currency_code: string) {
    let amount = currency_amount.toLocaleString();

    return amount;
  }
  async urlShortner(url: string) {
    try {
      // console.log("inside url shorten", url);

      let short_url = await TinyURL.shorten(url);
      return short_url;
    } catch (err) {
      throw err;
    }
  }
  applyVariables(input, context) {
    try {
      if (Array.isArray(input)) {
        for (let i = 0; i < input.length; i++) {
          let sub_input = input[i];
          let formatted_data = this.applyVariables(sub_input, context);
          if (typeof sub_input == "string") {
            input[i] = formatted_data;
          }
        }
      } else if (input && typeof input == "object") {
        let keys = Object.keys(input);
        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];
          let sub_input = input[key];
          let formatted_data = this.applyVariables(sub_input, context);
          if (typeof sub_input == "string") {
            input[key] = formatted_data;
          }
        }
      } else {
        if (typeof input == "string") {
          if (input.includes("var=>")) {
            let expr = input.replace("var=>", "");
            return eval(expr);
          } else {
            return input;
          }
        } else {
          return input;
        }
      }
      return input;
    } catch (err) {
    //  console.log("error in converting ", input);
      throw err;
    }
  }
  timeZoneConvert(offset) {
    offset *= 60;
    var num = Math.abs(offset);
    var hours = num / 60;
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    if (Math.sign(offset) == 1) {
      return "+0" + rhours + ":" + rminutes;
    } else {
      return "-0" + rhours + ":" + rminutes;
    }
  }

  formatZoneTime(
    iso_date: Date,
    abbr: string,
    offset: number,
    date_time: boolean = false
  ) {
    let zone_time = new Date(iso_date.getTime() + offset * 60 * 60 * 1000);
    let f_date = zone_time.getDate().toString().padStart(2, "0");
    let f_month = (zone_time.getMonth() + 1).toString().padStart(2, "0");
    let f_year = zone_time.getFullYear();
    let f_hour = zone_time.getHours();
    let f_min = zone_time.getMinutes();
    let f_sec = zone_time.getSeconds();
    let formatted_value = `${f_date}-${f_month}-${f_year}`;
    if (date_time)
      formatted_value = `${formatted_value} ${f_hour}:${f_min}:${f_sec}`;
    formatted_value = formatted_value + " " + abbr;
    return formatted_value;
  }

  timeRemaining(end_date: string | Date, time_difference?: number) {
    let return_value = {
      expired: false,
      expiring_soon: false,
      message: "",
    };
    if (!time_difference) {
      time_difference = new Date(end_date).getTime() - Date.now();
    }
    if (time_difference <= 0) {
      return_value.expired = true;
    } else {
      let day_difference = Math.floor(time_difference / (24 * 60 * 60 * 1000));
      let hour_difference = Math.floor(time_difference / (60 * 60 * 1000));
      let min_difference = Math.floor(time_difference / (60 * 60 * 1000));
      if (day_difference > 0) {
        return_value.message = `${day_difference} day${
          day_difference > 1 ? "s" : ""
        }`;
      } else if (hour_difference) {
        return_value.message = `${hour_difference} hour${
          hour_difference > 1 ? "s" : ""
        }`;
      } else if (min_difference) {
        return_value.message = `${min_difference} minute${
          min_difference > 1 ? "s" : ""
        }`;
      } else {
        return_value.expiring_soon = true;
      }
    }
    return return_value;
  }

  initCap(input_string: string) {
    return (
      input_string[0].toUpperCase() +
      input_string.substring(1, input_string.length).toLowerCase()
    );
  }

  getDateEndRange(end_date: string | Date) {
    try {
      if (typeof end_date == "string") end_date = new Date(end_date);
      let ms_to_add = 24 * 60 * 60 * 1000 - 1;
      return new Date(end_date.getTime() + ms_to_add);
    } catch (err) {
      throw err;
    }
  }

  processAxiosError(error) {
    let response = error.response.data;
    return new AppException(response.message, response.code);
  }

  encryptMessage(value: string) {
    try {
      let key: string = this.config.get("ENCRYPT_KEY");
      let cipher = aes256.createCipher(key);
      let encrypted_value = cipher.encrypt(value);
      return encrypted_value;
    } catch (err) {
      throw err;
    }
  }

  decryptMessage(value: string) {
    try {
      let key: string = this.config.get("ENCRYPT_KEY");
      let cipher = aes256.createCipher(key);
      let decrypted_value = cipher.decrypt(value);
      return decrypted_value;
    } catch (err) {
      throw err;
    }
  }
  generateRandomNumber(start_digit: number, end_digit: number) {
    return Math.floor(start_digit + (end_digit - start_digit) * Math.random());
  }
}
export enum app_date_ranges {
  all = "all",
  this_month = "this_month",
  this_week = "this_week",
  yesterday = "yesterday",
  today = "today",
  last_seven_days = "last_seven_days",
  last_three_months = "last_three_months",
  last_six_months = "last_six_months",
  last_twelve_months = "last_twelve_months",
  this_year = "this_year",
  this_financial_year = "this_financial_year",
  last_financial_year = "last_financial_year",
  last_year = "last_year",
  custom = "custom",
}

export enum app_report_key {
  sales_by_customer = "sales-by-customer",
  sales_by_branch = "sales-by-branch",
  sales_by_item = "sales-by-item",
  invoice_report = "invoice-report",
  payment_received_report = "payment-received-report",
  customer_balance = "customer-balance",
  inventory_summary_report = "inventory-summary-report",
}
export const app_variables = {
  default_language_id: "6091525efccd22ae080d9107",
  default_db_date_format_id: "6177bd95c8f14ed85c69aba8",
  default_db_date_format: "%d/%m/%Y",
  default_decimal_digits: 2,
  default_org_fcode: "organization",
  default_role_fcode: "ROLE",
  default_branch_fcode: "BRCH",
  default_warehouse_fcode: "WREHS",
  default_customer_fcode: "CUST",
  default_ecom_customer_fcode: "CUSTB2C",
  default_sales_person_fcode: "SLP",
  default_vendor_fcode: "VEND",
  default_user_fcode: "USR",
  support_ticket_fcode: "SPT",
  support_ticket_conv_fcode: "STC",
  item_fcode: "ITM",
  inquiry_fcode: "INQ",
  estimation_fcode: "EST",
  invoice_fcode: "INVO",
  sale_order_fcode: "SO",
  payment_received_fcode: "PMTR",
  package_fcode: "PACK",
  shipment_fcode: "SHIP",
  channel_digital_catalogue: "digital_catalogue",
  channel_online_store: "online_store",
  channel_wholesale: "wholesale",
  channel_retail: "retail",
  default_item_category_type: "items",
  default_subscription_fcode: "subscription",
  default_transfer_order_fcode: "transfer-order",
  default_deals_fcode: "deals",
  default_inventory_adjustment_fcode: "inventory-adjustment",
  default_calls_fcode: "calls",
  default_opening_balance_fcode: "opening-balance",
  default_opening_balance_detail_fcode: "opening-balance-detail",
  default_classification_fcode: "classification",
  default_merchant_fcode: "merchant",
  default_expenses_fcode: "expenses",
  default_expense_report_fcode: "expense-report",
  default_expense_tag_fcode: "expense-tag",
  default_general_ledger_fcode: "general-ledger",
  default_reason_fcode: "reason",
  default_purchase_order_fcode: "purchase-order",
  default_credit_note_fcode: "credit-notes",
  default_bills_fcode: "bills",
  default_payment_made_fcode: "PMTM",
  default_tds_fcode: "tds",
  default_tcs_fcode: "tcs",
  default_account_transaction_fcode: "account-transaction",
  default_refund_fcode: "refund",
  default_online_store_fcode: "online-store",
  default_collection_fcode: "collection",
  default_sort_fcode: "sort",
  default_discount_fcode: "discount",
  default_legals_fcode: "legal",
  default_reviews_fcode: "reviews",
  default_review_response_fcode: "review-response",
  default_nav_menu_fcode: "nav-menu",
  default_nav_menu_items_fcode: "nav-menu-items",
  default_sale_return_fcode: "sale-return",
  default_receive_fcode: "return-receipt",
  default_shipping_zone_fcode: "shipping-zone",
  default_shipping_region_fcode: "shipping-region",
  default_shipping_rate_fcode: "shipping-rate",
  default_cart_fcode: "cart",
  default_ecom_offline_payments_fcode: "ecom-offline-payments",
  default_app_credential_fcode: "app-credential",
  default_sn_org_profile_fcode: "sn-org-profile",
  default_feature_request_fcode: "feature-request",
  default_sa_feature_request_fcode: "sa-feature-request",
};

export enum activity_icon {
  status_change = "feather icon-refresh-ccw",
  assigned_to_user = "feather icon-user-check",
  file_text = "feather icon-file-text",
}
export interface SectionFields {
  field: string;
  field_name: string;
  is_unique: boolean;
  is_required: boolean;
}

export enum TypeMapping {
  string = "isString",
  objectid = "isMongoId",
  boolean = "isBooleanString",
  number = "isNumber",
}

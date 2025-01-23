import { HttpStatus, Injectable, Req } from "@nestjs/common";
import { EPaymentProvider } from "./enum/payment-providers.enum";
import { ICurrencyModel } from "src/shared/schema/currency.schema";
import { ConfigService } from "@nestjs/config";
import { ValidateRPPaymentId } from "./dto/validate-rp-payment.dto";
import { AppException } from "src/shared/app-exception";
import { HelperService } from "src/helper/helper.service";
const crypto = require("crypto");
const Razorpay = require("razorpay");

@Injectable()
export class PaymentService {
  constructor(
    private configService: ConfigService,
    private helperService: HelperService
  ) {}

  async getPGInstance() {
    try {
      let pg_instance;
      let pg_type = this.configService.get("PAYMENT_TYPE");
      let RAZORPAY_API_KEY = this.configService.get("RAZORPAY_API_KEY");
      let RAZORPAY_SECRET_KEY = this.configService.get("RAZORPAY_SECRET_KEY");
      switch (pg_type) {
        case EPaymentProvider.razorpay:
          pg_instance = new Razorpay({
            key_id: RAZORPAY_API_KEY,
            key_secret: RAZORPAY_SECRET_KEY,
          });
          break;
        default:
          break;
      }
      return {
        pg_instance,
        pg_type,
        pg_credentials: {
          RAZORPAY_API_KEY,
          RAZORPAY_SECRET_KEY,
        },
      };
    } catch (err) {
      throw err;
    }
  }
  async createPGOrder(
    user_id: string,
    currency: string,
    amount: number,
    reference_no: string,
    accessToken: string,
    notes?: any
  ) {
    try {
      let order_id: string;
      let pg_detail = await this.getPGInstance();
      let pg_instance = pg_detail.pg_instance;
      let pg_type: string = pg_detail.pg_type;
      let profile = await this.helperService.getProfileById(
        [user_id],
        accessToken,
        null
      );
      console.log("pg order notes is", notes);

      let pg_meta = { name: profile.userName };
      switch (pg_type) {
        case EPaymentProvider.razorpay:
          var options = {
            amount: amount,
            currency: currency,
            receipt: reference_no,
            notes,
          };
          let order_detail: any = await new Promise((res, rej) => {
            pg_instance.orders.create(options, function (err, order) {
              if (err) rej(err);
              res(order);
            });
          });
          order_id = order_detail.id;
          break;
        default:
          break;
      }

      return { pg_meta, pg_type, order_id };
    } catch (err) {
      throw err;
    }
  }

  async validatePayment(body: ValidateRPPaymentId) {
    let pg_type = this.configService.get("PAYMENT_TYPE");
    let RAZORPAY_API_KEY = this.configService.get("RAZORPAY_API_KEY");
    let is_valid: boolean = false;
    switch (pg_type) {
      case EPaymentProvider.razorpay:
        let RAZORPAY_SECRET_KEY = this.configService.get("RAZORPAY_SECRET_KEY");
        const hmac = crypto.createHmac("sha256", RAZORPAY_SECRET_KEY);
        hmac.update(body.razorpay_order_id + "|" + body.razorpay_payment_id);
        let generatedSignature = hmac.digest("hex");
        let isSignatureValid = generatedSignature == body.razorpay_signature;
        if (!isSignatureValid) {
          throw new AppException("Payment not matched", HttpStatus.FORBIDDEN);
        }
        is_valid = true;
        break;
      default:
        break;
    }
    return is_valid;
  }
}

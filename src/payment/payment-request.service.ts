import { PaymentService } from "../service-provider/payment.service";
import { InvoiceService } from "../invoice/invoice.service";
import { Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SharedService } from "src/shared/shared.service";
import { IPaymentModel } from "./schema/payment.schema";
import { paymentDTO } from "./dto/payment.dto";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { CurrencyService } from "src/shared/currency/currency.service";
import {
  EDocument,
  EDocumentTypeName,
} from "src/invoice/enum/document-type-name.enum";
import {
  EPaymentStatus,
  ERazorpayPaymentStatus,
  ESourceType,
} from "./enum/payment.enum";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { ServiceRequestService } from "src/service-request/service-request.service";
import {
  EServiceRequestStatus,
  EVisibilityStatus,
} from "src/service-request/enum/service-request.enum";
import { firstValueFrom } from "rxjs";
import { Cron } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios/";
import { ConfigService } from "@nestjs/config";
import { HelperService } from "src/helper/helper.service";
const { ObjectId } = require("mongodb");
const SimpleHMACAuth = require("simple-hmac-auth");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
// const {
//   validateWebhookSignature,
// } = require("razorpay/dist/utils/razorpay-utils");
@Injectable()
export class PaymentRequestService {
  constructor(
    @InjectModel("payment")
    private readonly paymentModel: Model<IPaymentModel>,
    private sharedService: SharedService,
    private paymentService: PaymentService,
    private serviceRequestService: ServiceRequestService,
    private invoiceService: InvoiceService,
    private currency_service: CurrencyService,
    private configService: ConfigService,
    private helperService:HelperService
  ) {}

  async initiatePayment(
    body: paymentDTO,
    token: UserToken,
    accessToken: string
  ) {
    try {
      // const existingInvoice = await this.invoiceService.getInvoiceBySource(
      //   body?.invoiceDetail?.sourceId?.toString(),
      //   body?.invoiceDetail?.sourceType
      // );

      const invoiceData = await this.createNewInvoice(body, token);
      body["serviceRequest"] = {
        ...body.serviceRequest,
        sourceId: invoiceData._id,
        sourceType: EDocument.sales_document,
      };
      // console.log("body is", body.serviceRequest);

      const serviceRequest =
        await this.serviceRequestService.createServiceRequest(
          body.serviceRequest,
          token
        );
      // console.log("service request is", serviceRequest.request._id);

      const existingPayment = await this.paymentModel.findOne({
        source_id: invoiceData._id,
        source_type: EDocumentTypeName.invoice,
      });

      if (existingPayment) {
        return { paymentData: existingPayment, serviceRequest };
      }

      const currency = await this.currency_service.getSingleCurrency(
        "6091525bf2d365fa107635e2"
      );
     if(body.couponCode != null){
     let couponBody = {
      sourceId: serviceRequest.request._id,
      sourceType: ESourceType.serviceRequest,
      couponCode: body.couponCode,
      billingAmount: body.amount,
      discountAmount: body.discount
     };
     console.log("toke is: "+ accessToken);
   
      const createCouponUsage = await this.helperService.createCouponUsage(couponBody, accessToken)
     }
      const orderDetail = await this.paymentService.createPGOrder(
        body.userId.toString(),
        currency,
        body.amount,
        serviceRequest.request._id.toString(),
        accessToken,
        {
          invoiceId: invoiceData._id,
          invoiceNumber: invoiceData.document_number,
        }
      );

      const paymentData = await this.createPaymentRecord(
        body,
        token,
        invoiceData,
        currency,
        orderDetail
      );
      // paymentData["serviceRequest"] = serviceRequest;
      return { paymentData, serviceRequest };
    } catch (err) {
      throw err;
    }
  }

  async createNewInvoice(body: paymentDTO, token: UserToken) {
    return await this.invoiceService.createInvoice(
      {
        source_id: null,
        source_type: null,
        couponCode: body.couponCode,
        discount: body.discount,
    
        sub_total: body.amount,
        document_status: EDocumentStatus.pending,
        grand_total: body.amount,
      },
      token
    );
  }

  async createPaymentRecord(
    body: paymentDTO,
    token: UserToken,
    invoiceData,
    currency,
    orderDetail
  ) {
    const paymentSequence = await this.sharedService.getNextNumber(
      "payment",
      "PMT",
      5,
      null
    );
    const paymentNumber = paymentSequence.toString().padStart(5, "0");

    const paymentData = {
      ...body,
      source_id: invoiceData._id,
      currency: currency._id,
      currency_code: currency.currency_code,
      source_type: EDocumentTypeName.invoice,
      payment_order_id: orderDetail?.order_id,
      transaction_type: "OUT",
      created_by: token.id,
      user_id: token.id,
      doc_id_gen_type: "Auto",
      payment_document_number: paymentNumber,
      document_number: paymentNumber,
    };

    return await this.paymentModel.create(paymentData);
  }

  async updatePaymentRequest(body) {
    try {
      await this.paymentModel.updateOne(
        { _id: body.id },
        {
          $set: { document_status: body.document_status },
        }
      );
      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }

  async getPaymentDetail(id: string) {
    try {
      let payment = await this.paymentModel.findOne({ _id: id });
      console.log(payment);
      return { payment };
    } catch (err) {
      throw err;
    }
  }
  // async validateWebhookSignature(body) {
  //   try {
  //     const key = this.configService.get("RAZORPAY_SECRET_KEY");
  //     const message = body; // raw webhook request body
  //     const received_signature = this.configService.get("RAZORPAY_SECRET_KEY");

  //     const expected_signature = hmac("sha256", message, key);

  //     if (expected_signature != received_signature) throw SecurityError;
  //     end;
  //   } catch (err) {
  //     throw err;
  //   }
  // }
  async paymentWebhook(@Req() req) {
    try {
      // console.log(
      //   "Razorpay request:",
      //   JSON.stringify(req.body),
      //   req["headers"]["x-razorpay-signature"],
      //  // req["headers"]["x-razorpay-event-id"]
      // );

      // console.log("recieved: "+req["headers"]["x-razorpay-signature"]);
      // var crypto = require("crypto");
      // var mbody = req.body.toString();
      // var expectedSignature = crypto.createHmac('sha256', "casttree@123").update(mbody).digest('hex');
      // console.log("generated: "+expectedSignature);
      // if(req["headers"]["x-razorpay-signature"] === expectedSignature){
      const { invoiceId, status, payment, invoice, serviceRequest } =
        await this.extractPaymentDetails(req.body);

      const ids = {
        invoiceId,
        serviceRequestId: serviceRequest.data["_id"],
        paymentId: payment._id,
      };
      // console.log("ids is", ids, serviceRequest.data["_id"]);
      await this.updatePaymentStatus(status, ids);
      return { message: "Updated Successfully" };
      //  }
    } catch (err) {
      throw err;
    }
  }

  async extractPaymentDetails(body) {
    console.log(
      "extrat payment invoice id",
      body?.payload?.payment?.entity?.notes.invoiceId,
      body?.payload?.payment?.entity?.notes
    );

    const invoiceId = new ObjectId(
      body?.payload?.payment?.entity?.notes.invoiceId
    );
    const status = body?.payload?.payment?.entity?.status;

    const payment = await this.paymentModel.findOne({
      source_id: invoiceId,
      source_type: EDocumentTypeName.invoice,
    });

    const invoice = await this.invoiceService.getInvoiceDetail(invoiceId);

    const serviceRequest =
      await this.serviceRequestService.getServiceRequestDetail(invoiceId);
    console.log("service request payment", serviceRequest);

    return { invoiceId, status, payment, invoice, serviceRequest };
  }

  async updatePaymentStatus(status, ids) {
    try {
      if (status === ERazorpayPaymentStatus.captured) {
        await this.completePayment(ids);
      }

      // if (status === ERazorpayPaymentStatus.failed) {
      //   await this.failPayment(ids);
      // }

      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }

  async completePayment(ids) {
    await this.invoiceService.updateInvoice(
      ids.invoiceId,
      EDocumentStatus.completed
    );
    await this.updatePaymentRequest({
      id: ids.paymentId,
      document_status: EDocumentStatus.completed,
    });
    await this.serviceRequestService.updateServiceRequest(
      ids.serviceRequestId,
      {
        // visibilityStatus: EVisibilityStatus.unlocked,
        requestStatus: EServiceRequestStatus.pending,
      }
    );
  }

  // Uncomment and implement if handling other statuses like failed
  // async failPayment(ids) {
  //   await this.invoiceService.updateInvoice(ids.invoiceId, EDocumentStatus.failed);
  //   await this.updatePaymentRequest({ id: ids.paymentId }, EDocumentStatus.failed);
  // }

  // @Cron("00 5 * * * *")
  // async handleCron() {
  //   let paymentRequestData: any = this.getPaymentDetail(
  //     "66cb5a55fd108b6e491595aa"
  //   );
  //   let orderId = await paymentRequestData.payment.payment_order_id;

  //   try {
  //     const PaymentStatusResponse: any = await firstValueFrom(
  //       this.httpService.get("https://api.razorpay.com/v1/orders/" + orderId, {
  //         headers: {
  //           Authorization:
  //             `Basic ` +
  //             Buffer.from(
  //               `rzp_test_n3mWjwFQzH7YDM:ipNWATmDo20pFsUhajVV4Ell`
  //             ).toString("base64"),
  //         },
  //       })
  //     );

  //     // Return the response data
  //     console.log("current status  :  " + PaymentStatusResponse.data.status);
  //     this.updatePaymentRequest(PaymentStatusResponse.data);
  //   } catch (error) {
  //     // Handle errors
  //     console.error("Error fetching data", error);
  //     throw error;
  //   }
  // }

  //   testhmac() {
  //     /* var crypto = require('crypto');
  // var hmac = crypto.createHmac('sha256', 'casttree@2024');
  // var expected_signature = hmac.update(JSON.stringify({name:"pavan"}));*/
  //     var crypto = require("crypto");
  //     const hash = crypto
  //       .createHmac("sha1", "casttree@2024")
  //       .update(JSON.stringify({ name: "pavan" }))
  //       .digest("hex");
  //     console.log(hash);
  //   }
  // }
  // function hmac(arg0: string, message: any, key: any) {
  //   throw new Error("Function not implemented.");
}

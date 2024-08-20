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
import { EDocumentTypeName } from "src/invoice/enum/document-type-name.enum";
import { EPaymentStatus } from "./enum/payment.enum";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";

@Injectable()
export class PaymentRequestService {
  constructor(
    @InjectModel("payment")
    private readonly paymentModel: Model<IPaymentModel>,
    private sharedService: SharedService,
    private paymentService: PaymentService,
    private invoiceService: InvoiceService,
    private currency_service: CurrencyService
  ) {}

  async initiatePayment(body: paymentDTO, token: UserToken, @Req() req) {
    try {
      let existingInvoice = await this.invoiceService.getInvoiceBySource(
        body.invoiceDetail.sourceId,
        body.invoiceDetail.sourceType
      );

      let invoice;
      if (!existingInvoice) {
        invoice = await this.invoiceService.createInvoice(
          {
            source_id: body.invoiceDetail.sourceId,
            source_type: body.invoiceDetail.sourceType,
            sub_total: body.amount,
            document_status: EDocumentStatus.pending,
            grand_total: body.amount,
          },
          token
        );
      }
      let invoiceData = existingInvoice ? existingInvoice : invoice;

      let existingPayment = await this.paymentModel.findOne({
        source_id: invoiceData._id,
        source_type: EDocumentTypeName.invoice,
      });
      if (!existingPayment) {
        let currency = await this.currency_service.getSingleCurrency(
          "6091525bf2d365fa107635e2"
        );
        let order_detail = await this.paymentService.createPGOrder(
          body.userId.toString(),
          currency,
          body.amount,
          body.invoiceDetail.sourceId.toString(),
          req,
          {
            invoiceId: invoiceData._id,
            invoiceNumber: invoiceData.document_number,
          }
        );
        let fv = {
          ...body,
          source_id: invoiceData._id,
          currency: currency._id,
          currency_code: currency.currency_code,
          source_type: EDocumentTypeName.invoice,
          payment_order_id: order_detail?.order_id,
          transaction_type: "OUT",
          created_by: token.id,
          user_id: token.id,
        };

        let payment_sequence = await this.sharedService.getNextNumber(
          "payment",
          "PMT",
          5,
          null
        );
        let payment_number = payment_sequence.toString();
        let payment_document_number = payment_number.padStart(5, "0");
        fv["doc_id_gen_type"] = "Auto";
        fv["payment_document_number"] = payment_document_number;
        fv["document_number"] = payment_document_number;
        let data = await this.paymentModel.create(fv);
        return data;
      } else {
        return existingPayment;
      }
    } catch (err) {
      throw err;
    }
  }

  async updatePaymentRequest(body, token) {
    try {
      await this.paymentModel.updateOne(
        { _id: body.id },
        {
          $set: { document_status: body.document_status, updated_by: token.id },
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
      return { payment };
    } catch (err) {
      throw err;
    }
  }

  async paymentWebhook(providerId, @Req() req) {
    try {
      console.log("razorpay request", req, req.body);

      return { response: req.body };
    } catch (err) {
      throw err;
    }
  }
}

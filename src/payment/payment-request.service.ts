import { forwardRef, Inject, Injectable, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { EMixedPanelEvents } from "src/helper/enums/mixedPanel.enums";
import { HelperService } from "src/helper/helper.service";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { EDocumentTypeName } from "src/invoice/enum/document-type-name.enum";
import { ServiceItemService } from "src/item/service-item.service";
import { EServiceRequestStatus } from "src/service-request/enum/service-request.enum";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { CurrencyService } from "src/shared/currency/currency.service";
import { SharedService } from "src/shared/shared.service";
import { InvoiceService } from "../invoice/invoice.service";
import { PaymentService } from "../service-provider/payment.service";
import { paymentDTO } from "./dto/payment.dto";
import { Cron } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import {
  EPaymentSourceType,
  EPaymentStatus,
  ERazorpayPaymentStatus,
  ESourceType,
} from "./enum/payment.enum";
import { IPaymentModel } from "./schema/payment.schema";
import { EProvider, EProviderId } from "src/subscription/enums/provider.enum";
import { SubscriptionService } from "src/subscription/subscription.service";
import { EStatus } from "src/shared/enum/privacy.enum";
import { EVENT_RECONCILE_CASHFREE, EVENT_RECONCILE_RAZORPAY } from "src/shared/app.constants";

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
    @Inject(forwardRef(() => ServiceRequestService))
    private serviceRequestService: ServiceRequestService,
    private invoiceService: InvoiceService,
    private currency_service: CurrencyService,
    private configService: ConfigService,
    private http_service: HttpService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService,
    private helperService: HelperService,
    @Inject(forwardRef(() => ServiceItemService))
    private serviceItemService: ServiceItemService,
    private eventEmitter: EventEmitter2
  ) { }

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

      let serviceRequest;
      if (body.serviceRequest) {
        serviceRequest = await this.serviceRequestService.createServiceRequest(
          body.serviceRequest,
          token
        );
        body.invoiceDetail = body.invoiceDetail || {};
        body.invoiceDetail.sourceId = serviceRequest.request._id;
        body.invoiceDetail.sourceType = EPaymentSourceType.serviceRequest;
      }

      const invoiceData = await this.createNewInvoice(body, token);

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
      if (body.couponCode != null) {
        let couponBody = {
          sourceId: serviceRequest.request._id,
          sourceType: ESourceType.serviceRequest,
          couponCode: body.couponCode,
          billingAmount: body.amount,
          discountAmount: body.discount,
        };

        const createCouponUsage = await this.helperService.createCouponUsage(
          couponBody,
          accessToken
        );
      }

      if (body.couponCode != null) {
        body.amount = body.amount - body.discount;
      }
      let requestId = serviceRequest?.request?._id.toString()
        ? serviceRequest?.request?._id.toString()
        : body?.invoiceDetail?.sourceId.toString();
      const orderDetail = await this.paymentService.createPGOrder(
        body.userId.toString(),
        body.currencyCode,
        body.currency,
        body.amount,
        requestId,
        accessToken,
        {
          invoiceId: invoiceData._id,
          itemId: body.itemId,
          invoiceNumber: invoiceData.document_number,
          userId: body.userId,
        }
      );

      const paymentData = await this.createPaymentRecord(
        body,
        token,
        invoiceData,
        currency,
        orderDetail
      );

      let serviceItemDetail: any =
        await this.serviceItemService.getServiceItemDetailbyItemId(body.itemId);
      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.initiate_payment;
      mixPanelBody.distinctId = body.userId;
      mixPanelBody.properties = {
        itemname: serviceItemDetail.itemId.itemName,
        amount: body.amount,
        cuurency_code: body.currencyCode,
        serviceItemType: serviceItemDetail.type,
      };

      await this.helperService.mixPanel(mixPanelBody);
      // paymentData["serviceRequest"] = serviceRequest;
      return { paymentData, serviceRequest };
    } catch (err) {
      throw err;
    }
  }

  async createNewInvoice(body: paymentDTO, token: UserToken) {
    let grand_total = body.amount;
    if (body.couponCode != null) {
      grand_total = body.amount - body.discount;
    }
    return await this.invoiceService.createInvoice({
      itemId: body.itemId,
      source_id: body?.invoiceDetail?.sourceId,
      source_type: body?.invoiceDetail?.sourceType,
      discount_amount: body?.discount,
      sub_total: body?.amount,
      currencyCode: body.currencyCode,
      document_status: EDocumentStatus.pending,
      grand_total: grand_total,
    });
  }

  async createPaymentRecord(
    body: paymentDTO,
    token: UserToken,
    invoiceData = null,
    currency = null,
    orderDetail = null,
    userId?: String
  ) {
    const paymentSequence = await this.sharedService.getNextNumber(
      "payment",
      "PMT",
      5,
      null
    );
    const paymentNumber = paymentSequence.toString().padStart(5, "0");
    // console.log("paymentRecord", body, invoiceData);

    const paymentData = {
      ...body,
      source_id: invoiceData._id,
      currency: currency?._id || body?.currency,
      currencyCode: body?.currencyCode,
      source_type: EDocumentTypeName.invoice,
      payment_order_id: orderDetail?.order_id,
      transaction_type: "OUT",
      created_by: body?.userId || token.id,
      user_id: body?.userId || token.id,
      doc_id_gen_type: "Auto",
      payment_document_number: paymentNumber,
      document_number: paymentNumber,
      paymentType: body?.paymentType,
      transactionDate: body.transactionDate
        ? body.transactionDate.toISOString()
        : new Date(),
      providerId: body?.providerId,
      providerName: body?.providerName,
    };
    if (body.document_status) {
      paymentData["paymentData"] = body.document_status;
    }
    return await this.paymentModel.create(paymentData);
  }

  async updatePaymentRequest(body, @Req() req) {
    try {
      let paymentData = await this.paymentModel.findOne({ _id: body.id });
      if (paymentData.currencyCode !== "INR") {
        const conversionRate = await this.helperService.getConversionRate(
          paymentData.currencyCode,
          paymentData.amount
        );
        let amt = parseInt((paymentData.amount * conversionRate).toString());
        await this.paymentModel.updateOne(
          { _id: paymentData._id },
          {
            $set: {
              conversionRate: conversionRate,
              baseCurrency: "INR",
              baseAmount: amt,
            },
          }
        );
      } else {
        await this.paymentModel.updateOne(
          { _id: paymentData._id },
          {
            $set: {
              conversionRate: 1,
              baseCurrency: "INR",
              baseAmount: paymentData.amount,
            },
          }
        );
      }

      await this.paymentModel.updateOne(
        { _id: body.id },
        { $set: { document_status: body.document_status } }
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

  async getPaymentDataBtOrderId(paymentId) {
    try {
      let payment = await this.paymentModel.findOne({
        payment_order_id: paymentId,
      });
      return payment;
    } catch (err) {
      throw err;
    }
  }

  async paymentWebhook(@Req() req) {
    try {
      const {
        invoiceId,
        status,
        payment,
        serviceRequest,
        itemId,
        amount,
        currency,
        userId,
      } = await this.extractPaymentDetails(req.body);

      const ids = {
        invoiceId,
        serviceRequestId: serviceRequest?.data?._id,
        paymentId: payment?._id,
        itemId,
        currency,
        amount,
        userId,
      };

      await this.updatePaymentStatus(status, ids);

      return { message: "Updated Successfully" };
    } catch (err) {
      return { message: "Failed to update payment status", error: err.message };
    }
  }

  async extractPaymentDetails(body) {
    const itemId = new ObjectId(body?.payload?.payment?.entity?.notes.itemId);
    const amount = parseInt(body?.payload?.payment?.entity?.amount) / 100;
    const userId = new ObjectId(body?.payload?.payment?.entity?.notes.userId);
    const currency = body?.payload?.payment?.entity?.currency;

    const invoiceId = new ObjectId(
      body?.payload?.payment?.entity?.notes.invoiceId
    );
    const status = body?.payload?.payment?.entity?.status;

    const payment = await this.paymentModel.findOne({
      source_id: invoiceId,
      source_type: EDocumentTypeName.invoice,
    });

    const invoice = await this.invoiceService.getInvoiceDetail(invoiceId);
    // let serviceRequest;
    // if (invoice.source_type == EPaymentSourceType.serviceRequest) {
    let serviceRequest =
      await this.serviceRequestService.getServiceRequestDetail(invoice.source_id);

    // }

    return {
      invoiceId,
      status,
      payment,
      invoice,
      serviceRequest,
      itemId,
      amount,
      currency,
      userId,
    };
  }

  async updatePaymentStatus(status, ids) {
    try {
      if (status === ERazorpayPaymentStatus.captured) {
        let serviceItemDetail: any =
          await this.serviceItemService.getServiceItemDetailbyItemId(
            ids.itemId
          );
        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.payment_success;
        mixPanelBody.distinctId = ids.userId;
        mixPanelBody.properties = {
          itemname: serviceItemDetail.itemId.itemName,
          amount: ids.amount,
          currency_code: ids.currency,
          serviceItemType: serviceItemDetail.type,
        };
        await this.helperService.mixPanel(mixPanelBody);
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

  async getPaymentDetailBySource(
    userId: string,
    sourceId?: string,
    type?: string
  ) {
    try {
      let aggregation_pipeline = [];
      aggregation_pipeline.push({
        $match: { user_id: new ObjectId(userId) },
      });
      aggregation_pipeline.push({
        $match: { document_status: EDocumentStatus.completed },
      });
      aggregation_pipeline.push({
        $lookup: {
          from: "salesDocument",
          localField: "source_id",
          foreignField: "_id",
          as: "salesDocument",
        },
      });
      sourceId
        ? aggregation_pipeline.push({
          $match: {
            "salesDocument.source_id": new ObjectId(sourceId),
            "salesDocument.source_type": EPaymentSourceType.processInstance,
            "salesDocument.document_status": EPaymentStatus.completed,
          },
        })
        : aggregation_pipeline.push({
          $match: {
            "salesDocument.source_type": EPaymentSourceType.processInstance,
            "salesDocument.document_status": EPaymentStatus.completed,
          },
        });
      aggregation_pipeline.push({
        $unwind: {
          path: "$salesDocument",
          preserveNullAndEmptyArrays: true,
        },
      });
      let paymentData = await this.paymentModel.aggregate(aggregation_pipeline);

      return { paymentData };
    } catch (err) {
      throw err;
    }
  }

  async completePayment(ids) {
    await this.invoiceService.updateInvoice(
      ids.invoiceId,
      EDocumentStatus.completed
    );
    await this.updatePaymentRequest(
      {
        id: ids.paymentId,
        document_status: EDocumentStatus.completed,
      },
      Req
    );

    if (ids?.serviceRequestId) {
      await this.serviceRequestService.updateServiceRequest(
        ids.serviceRequestId,
        {
          // visibilityStatus: EVisibilityStatus.unlocked,
          requestStatus: EServiceRequestStatus.pending,
        }
      );
    }
  }

  async fetchPaymentByOrderId(cfPaymentId: string) {
    try {
      let payment = await this.paymentModel.findOne({
        payment_order_id: cfPaymentId,
      });
      return payment;
    } catch (err) {
      throw err;
    }
  }

  async updateStatus(paymentId, body) {
    try {
      console.log("body", paymentId, body);

      const updateFields: any = {
        reason: body?.reason?.failureReason,
        document_status: body.document_status || body.status,
        metaData: body.metaData
      };

      const conversionBody = body.conversionBody || {};
      const optionalFields = ['baseAmount', 'baseCurrency', 'conversionRate'];

      for (const field of optionalFields) {
        if (conversionBody[field] !== undefined) {
          updateFields[field] = conversionBody[field];
        }
      }
      if (conversionBody.metaData) {
        updateFields.metaData = conversionBody.metaData;
      }
      console.log("updateFields", updateFields);

      const updateData = await this.paymentModel.updateOne(
        {
          $or: [
            { _id: paymentId },
            { source_id: paymentId }
          ]
        },
        {
          $set: updateFields,
        }
      );

      return updateData;
    } catch (err) {
      throw err;
    }
  }



  async getLatestSubscriptionPayments(userId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      let data = await this.paymentModel.aggregate([
        {
          $match: {
            user_id: new ObjectId(userId),
            document_status: EPaymentStatus.completed,
            created_at: { $gte: thirtyDaysAgo },
          },
        },
        {
          $lookup: {
            from: "salesDocument",
            localField: "source_id",
            foreignField: "_id",
            as: "salesDocument",
          },
        },
        {
          $unwind: "$salesDocument",
        },
        {
          $match: {
            "salesDocument.document_status": EPaymentStatus.completed,
            "salesDocument.source_type": EPaymentSourceType.subscription,
          },
        },
      ]);

      //  console.log({ data });
      return data;
    } catch (err) {
      throw err;
    }
  }
  async updateMetaData(paymentId, metaData) {
    try {
      let updateFields: any = {};
      if (metaData) {
        updateFields["metaData.webhookResponse"] = metaData;
      }
      let existingPayment = await this.paymentModel.findById(paymentId);
      if (!existingPayment.transactionDate) {
        updateFields.transactionDate = new Date();
      }
      let response = await this.paymentModel.updateOne(
        { _id: paymentId },
        { $set: updateFields }
      );

      return response;
    } catch (err) {
      throw err;
    }
  }
  private getProviderConfig(providerName: EProvider) {
    const configs = {
      [EProvider.razorpay]: {
        key: this.configService.get("RAZORPAY_API_KEY"),
        secret: this.configService.get("RAZORPAY_SECRET_KEY"),
        baseUrl: this.configService.get("RAZORPAY_BASE_URL"),
        paymentEndpoint: (orderId: string) => `/v1/orders/${orderId}/payments`
      },
      [EProvider.cashfree]: {
        key: this.configService.get("CASHFREE_API_KEY"),
        secret: this.configService.get("CASHFREE_SECRET_KEY"),
        baseUrl: this.configService.get("CASHFREE_BASE_URL"),
        paymentEndpoint: (orderId: string) => `/pg/orders/${orderId}/payments`
      }
    };
    return configs[providerName];
  }
  private async getPendingOrders(providerName: EProvider) {
    const filter = {
      document_status: EDocumentStatus.pending,
      providerName,
    };
    return this.paymentModel.find(filter);
  }

  private async reconcileOrder(order, providerConfig) {
    try {
      const orderId = order?.payment_order_id;
      // console.log("orderId", orderId);

      const paymentResponse = await this.http_service.get(
        `${providerConfig.baseUrl}${providerConfig.paymentEndpoint(orderId)}`,
        {
          auth: {
            username: providerConfig?.key,
            password: providerConfig?.secret,
          },
        }
      ).toPromise();

      const payments = paymentResponse.data?.items || [];

      for (const payment of payments) {
        await this.handlePaymentUpdate(order, payment);
      }
    } catch (error) {
      // console.log("error", error);
      return error
    }
  }

  private async handlePaymentUpdate(order, payment) {
    const providerName = order.providerName;
    const orderId = order.payment_order_id;
    // console.log("orderId", orderId);

    if (providerName === EProvider.razorpay && payment.id) {
      await this.paymentModel.updateOne(
        {
          payment_order_id: orderId,
          status: EStatus.Active,
          providerName: EProvider.razorpay,
          providerId: EProviderId.razorpay,
          document_status: EDocumentStatus.pending,
        },
        { $set: { referenceId: payment.id } }
      );
    }

    const documentStatus = payment.status === "captured"
      ? EDocumentStatus.completed
      : EDocumentStatus.failed;

    const reason = payment.status === "failed"
      ? payment?.error_description
      : payment?.error_description;

    const paymentData = await this.paymentModel.findOneAndUpdate(
      {
        payment_order_id: orderId,
        providerName,
        document_status: EDocumentStatus.pending,
      },
      {
        $set: { document_status: documentStatus, reason },
      },
      { new: true }
    );
    // console.log("paymentData", paymentData);

    if (paymentData?.source_id) {
      const body = {
        id: paymentData?.source_id,
        document_status: documentStatus,
      };
      const salesDocument = await this.invoiceService.updateSalesDocument(body);
      // console.log("salesDocument", salesDocument)
      await this.subscriptionService.updateSubscriptionData({
        id: salesDocument?.source_id,
        subscriptionStatus: documentStatus,
        providerName,
      });
    }
  }

  @Cron("0 * * * *")
  async handleRecon() {
    try {
      const supportedProviders = [EProvider.razorpay];

      for (const providerName of supportedProviders) {
        const eventMap = {
          [EProvider.razorpay]: EVENT_RECONCILE_RAZORPAY,
          [EProvider.cashfree]: EVENT_RECONCILE_CASHFREE,
        };

        const eventName = eventMap[providerName];
        if (eventName) {
          this.eventEmitter.emit(eventName); 
          console.log(`[${providerName}] Reconciliation event emitted.`);
        }
      }
    } catch (error) {
      // console.error("Error in handleRecon:", error.message);
      throw error;
    }
  }


  @OnEvent(EVENT_RECONCILE_RAZORPAY)
  async handleRazorpayReconciliation() {
    await this.handleReconciliationEvent(EProvider.razorpay);
  }

  @OnEvent(EVENT_RECONCILE_CASHFREE)
  async handleCashfreeReconciliation() {
    await this.handleReconciliationEvent(EProvider.cashfree);
  }
  private async handleReconciliationEvent(providerName: EProvider) {
    try {
      const providerConfig = this.getProviderConfig(providerName);

      const orders = await this.getPendingOrders(providerName);
      // console.log(`[${providerName}] Pending Orders:`, orders.map(order => order._id));

      for (const order of orders) {
        await this.reconcileOrder(order, providerConfig);
      }

      // console.log(`[${providerName}] Reconciliation completed.`);
    } catch (error) {
      throw error;
      // console.error(`[${providerName}] Reconciliation failed:`, error.message);
    }
  }

}

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
import { MandatesService } from "src/mandates/mandates.service";
import { ReconcileQueueService } from "./reconcile.queue.service";
import { OnEvent } from "@nestjs/event-emitter";
const { ObjectId } = require("mongodb");
let paymentStatus = []
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
    private mandateService: MandatesService,
    private reconcileQueue: ReconcileQueueService,
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
    return await this.invoiceService.createInvoice(
      {
        itemId: body.itemId,
        source_id: body?.invoiceDetail?.sourceId,
        source_type: body?.invoiceDetail?.sourceType,
        discount_amount: body?.discount,
        sub_total: body?.amount,
        currencyCode: body.currencyCode,
        document_status: EDocumentStatus.pending,
        grand_total: grand_total,
      },
      token.id
    );
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
      await this.serviceRequestService.getServiceRequestDetail(
        invoice.source_id
      );

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
        metaData: body.metaData,
      };

      const conversionBody = body.conversionBody || {};
      const optionalFields = ["baseAmount", "baseCurrency", "conversionRate"];

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
          $or: [{ _id: paymentId }, { source_id: paymentId }],
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

  async reconcileOrder(order: any, provider: string) {
    try {
      const orderId = order?.payment_order_id;
      const sourceId = order?.source_id;
      console.log("orderId",orderId)
      let payments = [];

      if (provider === EProvider.razorpay) {
        // console.log("Processing Razorpay order:", orderId);

        // const razorpayData = await this.helperService.getRazorpayPaymentByOrderId(orderId);
        // console.log("Razorpay API Response:", razorpayData);

        // payments = razorpayData?.items || [];

      } else if (provider === EProvider.cashfree) {
        const salesDocument = await this.invoiceService.getInvoiceDetail(sourceId);
        // console.log("salesDocument", salesDocument)
        const mandates = await this.mandateService.getMandatesBySourceId(salesDocument?.source_id);
        let paymentDetail = await this.paymentModel.findOne({source_id:salesDocument?.source_id});
        let subscription_id;
        let payment_id;
        let cashfreeResult = null;
        if (!mandates) {
          // console.log("subscription_id or payment_id is missing, attempting to fetch from subscription table and Cashfree API");
          const subscription = await this.subscriptionService.getSubscriptionBySubscriptionId(
            salesDocument?.source_id
          );
          // console.log("subscription",subscription)
          if (subscription && subscription.metaData?.subscription_id) {
            subscription_id = subscription.metaData.subscription_id;
            // console.log("Found subscription_id from subscription table:", subscription_id);
          }
          // First get all payment data from Cashfree API
          const allPaymentData = await this.getPaymentIdFromCashfree(subscription_id);
          
          // Filter to find the payment that matches orderId
          if (allPaymentData.paymentData && allPaymentData.paymentData.length > 0) {
            console.log("Looking for orderId:", orderId);
            console.log("Available cf_payment_ids:", allPaymentData.paymentData.map(p => p.cf_payment_id));
            
            const matchedPayment = allPaymentData.paymentData.find(payment => 
              payment.cf_payment_id === orderId
            );
            
            if (matchedPayment) {
              console.log(`Found matching payment: ${matchedPayment.cf_payment_id} === ${orderId}`);
              // Get the payment_id from the matched payment
              payment_id = matchedPayment.authorization_details?.payment_id;
              console.log("Found payment_id from matched payment:", payment_id);
            } else {
              console.log(`No payment found matching orderId: ${orderId}`);
            }
          }
        
        }
        // console.log("mandates", mandates)
        // let { subscription_id, payment_id } = mandates?.metaData || {};
        // console.log("subscription_id", subscription_id, payment_id)
        
        // If subscription_id or payment_id is empty/null, try to get them
       
        
        if (subscription_id && payment_id) {
          // Use reconcileQueue with the found payment_id to get paymentData
          const paymentData = await this.reconcileQueue.enqueue(subscription_id, payment_id);
          payments = paymentData || [];
          console.log("Using paymentData from reconcileQueue with matched payment_id:", payments);
        } else {
          console.log("Unable to get subscription_id or payment_id for reconciliation");
        }
      }
      if (payments.length >= 1) {
        paymentStatus.push(payments.map(payment => payment.payment_status))
        // console.log("payments", payments);

        for (const payment of payments) {
          await this.handlePaymentUpdate(order, payment);
        }

      }

      console.log(`Completed processing all payments for order ${order.payment_order_id}`);
    } catch (error) {
      console.error('Error in reconcileOrder:', error);
      throw error;
    }
  }

  @Cron('*/5 * * * *')
  async handleRecon() {
    try {
      const query: any = {
        document_status: EDocumentStatus.pending,
        providerName: EProvider.cashfree,
        paymentType: "Charge",
        created_at: {
          $lte: "2025-09-10T23:59:59.000+00:00"
        },
      };

      const payments = await this.paymentModel.find(query).lean();

      console.log("length", payments.length)
      for (const order of payments) {
        try {
          // console.log("order", order)
          await this.reconcileOrder(order, EProvider.cashfree);
        } catch (error) {
          console.error(`Error processing order ${order.payment_order_id}:`, error);
          continue;
        }
      }
      console.log(`✅ Reconciliation completed for ${payments.length} orders`);
    } catch (error) {
      console.error('Error in handleRecon:', error);
      throw error;
    }
  }

  @OnEvent(EVENT_RECONCILE_RAZORPAY)
  async handleRazorpayReconciliation(payments: any[]) {
    await this.handleReconciliationEvent(EProvider.razorpay, payments);
  }

  @OnEvent(EVENT_RECONCILE_CASHFREE)
  async handleCashfreeReconciliation(payments: any[]) {
    await this.handleReconciliationEvent(EProvider.cashfree, payments);
  }

  private async handleReconciliationEvent(providerName: EProvider, payments: any[]) {
    try {
      // console.log(`[${providerName}] Processing ${payments.length} pending payments`);

      for (const order of payments) {
        try {
          await this.reconcileOrder(order, providerName);
        } catch (error) {
          console.error(`[${providerName}] Error processing order ${order.payment_order_id}:`, error);
          continue;
        }
      }

      console.log(`[${providerName}] Reconciliation completed for ${payments.length} orders`);

    } catch (error) {
      throw error;
    }
  }

  async handlePaymentUpdate(order: any, payment: any) {
    const { providerName, payment_order_id: orderId } = order;
    let documentStatus;
    let reason;

    // const existingPayment = await this.paymentModel.findOne({
    //   payment_order_id: providerName === EProvider.cashfree ? payment?.cf_payment_id : orderId,
    //   document_status: { $ne: EDocumentStatus.pending }
    // });

    // if (existingPayment) {
    //   console.log(`[${providerName}] Payment ${orderId} already processed, skipping...`);
    //   return;
    // }

    if (providerName === EProvider.razorpay && payment?.id) {
      // await this.paymentModel.updateOne(
      //   {
      //     payment_order_id: orderId,
      //     status: EStatus.Active,
      //     providerName: EProvider.razorpay,
      //     providerId: EProviderId.razorpay,
      //     document_status: EDocumentStatus.pending,
      //   },
      //   { $set: { referenceId: payment.id } }
      // );

      // switch (payment.status) {
      //   case 'authorized':
      //   case 'captured':
      //     documentStatus = EDocumentStatus.completed;
      //     break;
      //   case 'failed':
      //     documentStatus = EDocumentStatus.failed;
      //     reason = payment?.error_description || null;
      //     break;
      //   default:
      //     documentStatus = EDocumentStatus.pending;
      // }
    }
    else if (providerName === EProvider.cashfree) {
      switch (payment.payment_status) {
        case 'SUCCESS':
          documentStatus = EDocumentStatus.completed;
          break;
        case 'FAILED':
          documentStatus = EDocumentStatus.failed;
          reason = payment?.failure_details?.failure_reason || null;
          break;
        case 'PENDING':
          documentStatus = EDocumentStatus.pending;
          break;
        case 'CANCELLED':
          documentStatus = EDocumentStatus.failed;
          reason = payment?.failure_details?.failure_reason || null;
          break;
        default:
          documentStatus = EDocumentStatus.pending;
      }
    }

    const matchQuery: any = {
      providerName,
      document_status: EDocumentStatus.pending,
    };

    if (providerName === EProvider.cashfree) {
      matchQuery["payment_order_id"] = payment?.cf_payment_id;
    } else {
      matchQuery["payment_order_id"] = orderId;
    }
    console.log("matchQuery", matchQuery,documentStatus)
    const updatedPayment = await this.paymentModel.findOneAndUpdate(
      matchQuery,
      {
        $set: { document_status: documentStatus, reason },
      },
      { new: true }
    );
    console.log("updatedPayment", updatedPayment)
    if (updatedPayment?.source_id) {
      const body = {
        id: updatedPayment?.source_id,
        document_status: documentStatus,
      };
      console.log("body",body)
      const salesDocument = await this.invoiceService.updateSalesDocument(body);
      await this.subscriptionService.updateSubscriptionData({
        id: salesDocument?.source_id,
        subscriptionStatus: documentStatus,
        providerName,
      });
      console.log("completed")
    }
    console.log("paymentStatus", paymentStatus,reason)
  }

  async getPaymentIdFromCashfree(subscriptionId: string): Promise<{ payment_id: string | null, paymentData: any[] }> {
    try {
      const cashfreeBaseUrl = this.configService.get('CASHFREE_BASE_URL');
      const clientId = this.configService.get('CASHFREE_CLIENT_ID');
      const clientSecret = this.configService.get('CASHFREE_CLIENT_SECRET');

      if (!cashfreeBaseUrl || !clientId || !clientSecret) {
        console.error('Cashfree configuration is missing');
        return { payment_id: null, paymentData: [] };
      }

      const url = `${cashfreeBaseUrl}/pg/subscriptions/${subscriptionId}/payments`;
      
      const headers = {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2025-01-01',
        'Content-Type': 'application/json'
      };

      // console.log(`Fetching payments for subscription: ${subscriptionId}`);
      // console.log(`Cashfree API URL: ${url}`);
      
      const response = await this.http_service.axiosRef.get(url, { headers });
      if (response.data && response.data.length > 0) {
        // Get the latest payment (assuming they are ordered by creation date)
        const latestPayment = response.data[0];
        return {
          payment_id: latestPayment.authorization_details?.payment_id,
          paymentData: response.data
        };
      }
      
      console.log(`No payments found for subscription: ${subscriptionId}`);
      return { payment_id: null, paymentData: [] };
    } catch (error) {
      console.error(`Error fetching payment_id for subscription ${subscriptionId}:`, error.response?.data || error.message);
      if (error.response?.status === 404) {
        console.log(`Subscription ${subscriptionId} not found in Cashfree`);
      } else if (error.response?.status === 401) {
        console.error('Cashfree API authentication failed');
      }
      return { payment_id: null, paymentData: [] };
    }
  }

}



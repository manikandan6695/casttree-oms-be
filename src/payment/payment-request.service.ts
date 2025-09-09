import { forwardRef, Inject, Injectable, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { EMixedPanelEvents } from "src/helper/enums/mixedPanel.enums";
import { HelperService } from "src/helper/helper.service";
import {
  EDocumentStatus,
  ESDocumentStatus,
} from "src/invoice/enum/document-status.enum";
import { EDocumentTypeName } from "src/invoice/enum/document-type-name.enum";
import { ServiceItemService } from "src/item/service-item.service";
import { EServiceRequestStatus } from "src/service-request/enum/service-request.enum";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { CurrencyService } from "src/shared/currency/currency.service";
import { SharedService } from "src/shared/shared.service";
import { InvoiceService } from "../invoice/invoice.service";
import { PaymentService } from "../service-provider/payment.service";
import { paymentDTO, filterTypeDTO, paymentIsSentToMetaDTO } from "./dto/payment.dto";
import {
  EAdminId,
  ECoinStatus,
  ECoinTransactionTypes,
  ECurrencyName,
  EFilterType,
  EPaymentSourceType,
  EPaymentStatus,
  ERazorpayPaymentStatus,
  ERedisEventType,
  ESourceType,
  ESourceTypes,
  ETransactionState,
  ETransactionType,
} from "./enum/payment.enum";
import { IPaymentModel } from "./schema/payment.schema";
import { ISalesDocumentModel } from "src/invoice/schema/sales-document.schema";
import { EProvider, EProviderId } from "src/subscription/enums/provider.enum";
import { EsubscriptionStatus } from "src/process/enums/process.enum";
import { ICoinTransaction } from "./schema/coinPurchase.schema";
import { RedisService } from "src/redis/redis.service";
import { SubscriptionService } from "src/subscription/subscription.service";
const jwt = require("jsonwebtoken");
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
    private helperService: HelperService,
    @Inject(forwardRef(() => ServiceItemService))
    private serviceItemService: ServiceItemService,
    @InjectModel("salesDocument")
    private readonly salesDocumentModel: Model<ISalesDocumentModel>,
    @InjectModel("coinTransaction")
    private readonly coinTransactionModel: Model<ICoinTransaction>,
    private redisService: RedisService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService
  ) {}
  async handleCoinPurchaseFromRedis(coinPurchaseData: any) {
    try {
      if (coinPurchaseData?.key === ERedisEventType.coinPurchase) {
        // console.log("coinPurchaseData!", coinPurchaseData?.element);
        const parsedElement = JSON.parse(coinPurchaseData.element);
        const accessTokenData = parsedElement?.authToken;
        const token = accessTokenData?.replace(/^Bearer\s+/i, "");
        const payload = parsedElement?.payload;
        const existingData = await this.invoiceService.getSalesDocumentBySource(
          payload?.coinTransactionId,
          EPaymentSourceType.coinTransaction
        );
        if (existingData) {
          // console.log("Existing data Found:", existingData);
          return existingData;
        }
        const bodyData: paymentDTO = {
          amount: payload?.amount,
          paymentMode: payload?.paymentMode,
          userId: payload?.userId,
          itemId: payload?.itemId,
          currencyCode: payload?.currencyCode,
          transactionDate: new Date(),
          providerId: EProviderId.razorpay,
          providerName: EProvider.razorpay,
          document_status: EPaymentStatus.initiated,
          invoiceDetail: {
            sourceType: EPaymentSourceType.coinTransaction,
            sourceId: payload?.coinTransactionId,
          },
        };

        // console.log("Payment Payload:", bodyData);
        const decodedToken = jwt.decode(token) as UserToken;
        // console.log("decodedToken",decodedToken);
        await this.initiatePayment(bodyData, decodedToken, accessTokenData);
        let invoiceData = await this.invoiceService.getSalesDocumentBySource(
          payload?.coinTransactionId,
          EPaymentSourceType.coinTransaction
        );
        let orderId = await this.paymentModel.findOne({
          user_id: payload?.userId,
          source_id: new ObjectId(invoiceData?._id),
          source_type: EDocumentTypeName.invoice,
          document_status: EPaymentStatus.initiated,
          providerId: EProviderId.razorpay,
          providerName: EProvider.razorpay,
        });
        if (orderId) {
          let consumer =
            await this.helperService.getUserByUserId(accessTokenData);
          let eventOutBoxPayload = {
            userId: payload?.userId,
            eventName: ERedisEventType.intermediateTransfer,
            sourceId: new ObjectId(invoiceData?._id),
            sourceType: EDocumentTypeName.invoice,
            consumer: consumer?.userName,
            payload: orderId,
          };
          let coinTransactionId = await this.invoiceService.getInvoiceDetail(
            orderId?.source_id
          );
          // console.log("existingData", coinTransactionId?.source_id);
          await this.redisService.pushToIntermediateTransferQueue(
            eventOutBoxPayload,
            orderId,
            coinTransactionId?.source_id.toString()
          );
        }
      }
    } catch (err) {
      // console.error("Error handling coin purchase from Redsis:", err);
      throw err;
    }
  }

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
      if (
        body.providerId === EProviderId.apple &&
        body.providerName === EProvider.apple
      ) {
        let appleCoinPurchase =
          await this.subscriptionService.handleIapCoinTransactions(body, token);
        return appleCoinPurchase;
      }
      else if(body.providerId === EProviderId.google && body.providerName === EProvider.google){
        let googleCoinPurchase = await this.subscriptionService.handleIapCoinTransactions(body,token)
        return googleCoinPurchase;
      }
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

  async getPaymentDetail(id: string,token: UserToken) {
    try {
      let payment;
      let paymentData = await this.paymentModel.findOne({ _id: id }).lean();
      const firstPayment = await this.paymentModel.findOne({
        user_id: new ObjectId(token.id),
        document_status: EDocumentStatus.completed,
      }).sort({ transactionDate: 1 });
      
      payment = {
        ...paymentData
      }
      if (!paymentData?.metaData?.isSentToMeta) {
        payment.isFirstPayment = firstPayment && firstPayment._id.toString() === id.toString();
      }
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
      // console.log("body", paymentId, body);

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
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(23, 59, 59, 999);

      // Step 1: Fetch all completed payments with sales document
      let allPayments = await this.paymentModel.aggregate([
        {
          $match: {
            user_id: new ObjectId(userId),
            document_status: EPaymentStatus.completed,
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
          },
        },
      ]);

      // Step 2: Identify the earliest payment
      let earliestPaymentId: string | undefined;
      let earliestPaymentDate: Date | undefined;

      if (allPayments.length > 0) {
        const earliest = allPayments.reduce((prev, curr) =>
          new Date(prev.created_at) < new Date(curr.created_at) ? prev : curr
        );
        earliestPaymentId = earliest._id?.toString();
        earliestPaymentDate = new Date(earliest.created_at);
      }

      // Step 3: Check if earliest payment is today
      const isFirstPaymentToday =
        earliestPaymentDate &&
        earliestPaymentDate >= startTime &&
        earliestPaymentDate <= endTime;

      // Helper: map sourceType to display title
      const getTitleFromSourceType = (sourceType: string): string | null => {
        switch (sourceType) {
          case EPaymentSourceType.coinTransaction:
            return ESourceTypes.coin;
          case EPaymentSourceType.subscription:
            return ESourceTypes.subscription;
          default:
            return null;
        }
      };

      // Step 4: Map payments and set isFirstPayment (but don't return it)
      allPayments = await Promise.all(
        allPayments.map(async (payment) => {
          let type = getTitleFromSourceType(
            payment?.salesDocument?.source_type
          );

          if (
            payment?.salesDocument?.source_type ===
              EPaymentSourceType.serviceRequest &&
            payment.salesDocId
          ) {
            const serviceRequestDetail =
              await this.serviceRequestService.getServiceRequestDetail(
                payment.salesDocId
              );

            const serviceType = serviceRequestDetail?.data?.type;
            if (serviceType === EPaymentSourceType.feedback) {
              type = ESourceTypes.feedback;
            } else if (serviceType === EPaymentSourceType.workshop) {
              type = ESourceTypes.workshop;
            }
          }

          // Calculate isFirstPayment but don't include it in the return
          const isFirstPayment =
            isFirstPaymentToday &&
            payment._id?.toString() === earliestPaymentId
              ? true
              : undefined;

          return {
            ...payment,
            type,
            // isFirstPayment field is calculated but not returned
          };
        })
      );

      // Step 5: Filter valid payments and return first one if today
      const filtered = allPayments.filter((payment) => payment.type !== null);
      // const firstPayment = filtered.find(
      //   (payment) => payment.isFirstPayment === true
      // );
      return filtered || [];
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
  async updateCoinValue(paymentId: string,token: UserToken) {
    try {
      let payment;
      let paymentData = await this.paymentModel.findOne({
        _id: new ObjectId(paymentId),
      }).lean();
      let totalBalance;
      let invoiceData = await this.invoiceService.getInvoiceDetail(
        paymentData?.source_id
      );
      const firstPayment = await this.paymentModel.findOne({
        user_id: new ObjectId(token.id),
        document_status: EDocumentStatus.completed,
      }).sort({ created_at: 1 });
      
      payment = {
        ...paymentData,
        isFirstPayment: firstPayment && firstPayment._id.toString() === paymentId.toString(),
      }
      if (
        payment?.document_status === EDocumentStatus.completed &&
        invoiceData?.document_status === EDocumentStatus.completed
      ) {
        let coinData = await this.currency_service.getCurrencyByCurrencyName(
          ECurrencyName.currencyId,
          ECurrencyName.casttreeCoin
        );

        let coinTransaction = await this.coinTransactionModel.findOne({
          sourceId: new ObjectId(invoiceData?._id),
          transactionType: ETransactionType.In,
          type: ETransactionType.purchased,
        });
        if (
          coinTransaction?.documentStatus === ECoinStatus.pending &&
          coinTransaction?.transactionType === ECoinTransactionTypes.In
        ) {
          let updateUserAdditional =
            await this.helperService.updateUserPurchaseCoin({
              userId: coinTransaction?.userId,
              coinValue: coinTransaction?.coinValue,
            });
          totalBalance =
            (updateUserAdditional?.purchasedBalance || 0) +
            (updateUserAdditional?.earnedBalance || 0);
          await this.coinTransactionModel.updateOne(
            {
              sourceId: new ObjectId(invoiceData?._id),
              transactionType: ETransactionType.In,
              documentStatus: ECoinStatus.pending,
            },
            {
              $set: {
                documentStatus: ECoinStatus.completed,
                updatedAt: new Date(),
                currentBalance: totalBalance,
              },
            }
          );
        }
        let coinTransactionOut = await this.coinTransactionModel.findOne({
          sourceId: new ObjectId(invoiceData?._id),
          transactionType: ETransactionType.Out,
          type: ETransactionType.withdrawn,
        });
        if (
          coinTransactionOut?.documentStatus === ECoinStatus.pending &&
          coinTransactionOut?.transactionType === ECoinTransactionTypes.Out
        ) {
          let updateUserAdditionalData =
            await this.helperService.updateAdminCoinValue({
              userId: coinTransactionOut?.userId,
              coinValue: coinTransactionOut?.coinValue,
            });
          await this.coinTransactionModel.updateOne(
            {
              sourceId: new ObjectId(invoiceData?._id),
              transactionType: ETransactionType.Out,
              documentStatus: ECoinStatus.pending,
            },
            {
              $set: {
                documentStatus: ECoinStatus.completed,
                updatedAt: new Date(),
                currentBalance: updateUserAdditionalData?.purchasedBalance,
              },
            }
          );
        }
        let finalResponse = {
          coinValue: coinTransaction?.coinValue,
          totalBalance: totalBalance,
          coinMedia: coinData?.media,
          paymentData: payment,
        };
        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.coin_purchase_success;
        mixPanelBody.distinctId = coinTransaction?.userId;
        mixPanelBody.properties = {
          user_id: coinTransaction?.userId,
          amount: payment?.amount,
          currency: invoiceData?.currencyCode,
          coin_value: coinTransaction?.coinValue,
        };
        await this.helperService.mixPanel(mixPanelBody);
        return finalResponse;
      } else {
        return {
          coinValue: 0,
          totalBalance: 0,
          paymentData: payment,
        };
      }
    } catch (err) {
      throw err;
    }
  }

  async handleTransactionHistory(
    token: UserToken,
    skip: number,
    limit: number,
    filterType?: EFilterType
  ) {
    try {
      let title;
      const filterData: any = {
        user_id: new ObjectId(token?.id),
        document_status: EPaymentStatus.completed,
      };
      if (filterType === EFilterType.purchase) {
        filterData.transaction_type = ETransactionState.Out;
      } else if (filterType === EFilterType.withdrawal) {
        filterData.transaction_type = ETransactionState.In;
      } else {
        filterData.transaction_type = {
          $in: [ETransactionState.Out, ETransactionState.In],
        };
      }
      const [result] = await this.paymentModel.aggregate([
        { $match: filterData },
        {
          $lookup: {
            from: "salesDocument",
            localField: "source_id",
            foreignField: "_id",
            as: "salesDoc",
          },
        },
        { $unwind: { path: "$salesDoc", preserveNullAndEmptyArrays: true } },
        {
          $facet: {
            paginatedResults: [
              { $sort: { created_at: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  amount: 1,
                  currencyCode: 1,
                  transactionDate: 1,
                  created_at: 1,
                  document_status: 1,
                  transaction_type: 1,
                  source_type: "$salesDoc.source_type",
                  salesDocId: "$salesDoc.source_id",
                },
              },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      const payments = result.paginatedResults;
      const totalCount = result.totalCount[0]?.count || 0;

      const getTitleFromSourceType = (sourceType: string) => {
        switch (sourceType) {
          case EPaymentSourceType.coinTransaction:
            return ETransactionType.coinPurchased;
          case EPaymentSourceType.subscription:
            return ETransactionType.subscriptionPurchased;
          case EPaymentSourceType.serviceRequest:
            return ETransactionType.feedbackPurchased;
          case EPaymentSourceType.processInstance:
            return ETransactionType.coursePurchased;
          default:
            return null;
        }
      };
      // if(getTitleFromSourceType?. === EPaymentSourceType.serviceRequest){
      //   let serviceRequest = await this.serviceRequestService.getServiceRequestDetail(payments?.salesDocId);
      //   console.log("serviceRequest", serviceRequest);
      // }

      const validPayments = payments.filter(
        (payment) => getTitleFromSourceType(payment.source_type) !== null
      );
      const results = await Promise.all(
        validPayments.map(async (payment) => {
          let transactionType =
            payment?.transaction_type === ETransactionState.Out
              ? ETransactionType.purchased
              : ETransactionType.withdrawal;
          title = getTitleFromSourceType(payment.source_type);
          if (
            payment.source_type === EPaymentSourceType.serviceRequest &&
            payment.salesDocId
          ) {
            const serviceRequestDetail =
              await this.serviceRequestService.getServiceRequestDetail(
                payment.salesDocId
              );
            if (
              serviceRequestDetail?.data?.type === EPaymentSourceType.feedback
            ) {
              title = ETransactionType.feedbackPurchased;
            } else if (
              serviceRequestDetail?.data?.type ===
              EPaymentSourceType.processInstance
            ) {
              title = ETransactionType.coursePurchased;
            }
          }
          return {
            currencyCode: payment?.currencyCode,
            title,
            amount: payment.amount,
            purchaseDate: payment.transactionDate || payment.created_at,
            documentStatus: payment.document_status,
            type: transactionType,
          };
        })
      );

      return {
        data: results,
        totalCount: totalCount,
      };
    } catch (error) {
      throw error;
    }
  }
  async updatePaymentMeta(paymentId: string, payload: paymentIsSentToMetaDTO,token: UserToken) {
    try{
      let payment = await this.paymentModel.findOneAndUpdate({
        _id: new ObjectId(paymentId),
      }, {
        $set: {
          "metaData.isSentToMeta": payload.isSentToMeta,
        },
      }, { new: true}
    )
    if (payment){
      let salesDoc = await this.salesDocumentModel.findOne({
        _id: new ObjectId(payment.source_id),
      })
      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.meta_event_sent;
      mixPanelBody.distinctId = payment.user_id;
      mixPanelBody.properties = {
        user_id: payment.user_id,
        payment_id: paymentId,
        subscription_id: salesDoc?.source_id,
      };
      console.log("mixPanelBody", mixPanelBody);
      await this.helperService.mixPanel(mixPanelBody);
    }
    return payment
    }
    catch (error){
      throw error;
    }
  }
  async createCoinValue(payload) {
    try {
      let userAdditional = await this.helperService.updateAdminCoinValue({
        coinValue: payload.coinValue,
        userId: EAdminId.userId,
      });
      let getUserAdditional =
        await this.helperService.getUserAdditionalDetails(payload);
     let d1 = await this.helperService.updateUserPurchaseCoin({
        coinValue: payload.coinValue,
        userId: payload.userId,
      });
      let totalAmt =
        getUserAdditional?.userAdditional?.purchasedBalance + payload.coinValue;
      let body = {
        documentStatus: EDocumentStatus.completed,
        transactionDate: new Date(),
        status: EDocumentStatus.active,
        coinValue: payload.coinValue,
        sourceId: payload.sourceId,
        sourceType: payload.sourceType,
      };
      let coinTransactionDetails = await this.coinTransactionModel.create({
        ...body,
        type: ETransactionType.purchased,
        transactionType: ETransactionType.In,
        currentBalance: totalAmt,
        userId: payload.userId,
        senderId: userAdditional?.userId,
        receiverId: payload.userId,
      });
     let coin= await this.coinTransactionModel.create({
        ...body,
        userId: userAdditional.userId,
        senderId: payload?.userId,
        receiverId: userAdditional.userId,
        type: ETransactionType.withdrawn,
        transactionType: ETransactionType.Out,
        currentBalance: userAdditional?.purchasedBalance,
      });
      // console.timeEnd("coin flow")
      return coinTransactionDetails?._id;
    } catch (error) {
      throw error;
    }
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

  //     this.updatePaymentRequest(PaymentStatusResponse.data);
  //   } catch (error) {
  //     // Handle errors

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

  //   }
  // }
  // function hmac(arg0: string, message: any, key: any) {
  //   throw new Error("Function not implemented.");
}

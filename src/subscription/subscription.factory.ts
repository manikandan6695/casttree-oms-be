import { MandatesService } from "./../mandates/mandates.service";
import { Injectable } from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HttpService } from "@nestjs/axios";
import { SubscriptionProvider } from "./subscription.interface";
import { HelperService } from "src/helper/helper.service";
import { SharedService } from "src/shared/shared.service";
import { SubscriptionService } from "./subscription.service";

@Injectable()
export class SubscriptionFactory {
  constructor(
    private readonly helperService: HelperService,
    private readonly sharedService: SharedService,
    private readonly mandateService: MandatesService,
    private readonly subscriptionService: SubscriptionService
  ) {}

  getProvider(providerName: string): SubscriptionProvider {
    switch (providerName) {
      case "razorpay":
        return {
          createSubscription: async (data: any, token: UserToken) => {
            // Razorpay API Integration
            const response = await this.helperService.addSubscription(
              data,
              token
            );
            return response;
          },
        };
      case "cashfree":
        return {
          createSubscription: async (data: any, token: UserToken) => {
            // Cashfree API Integration
            const subscription = await this.helperService.createSubscription(
              data,
              token
            );
            const paymentSequence = await this.sharedService.getNextNumber(
              "cashfree-payment",
              "CSH-PMT",
              5,
              null
            );
            const paymentNumber = paymentSequence.toString().padStart(5, "0");
            let authData = {
              subscription_id: subscription?.subscription_id,
              payment_id: paymentNumber,
              payment_amount:
                subscription?.authorization_details?.authorization_amount,
              payment_schedule_date: new Date().toISOString(),
              payment_type: "AUTH",
              payment_method: {
                upi: {
                  channel: "link",
                },
              },
            };
            const auth = await this.helperService.createAuth(authData);
            let subscriptionData = {
              userId: token.id,
              planId: subscription.plan_details.plan_id,
              startAt: data.startAt,
              endAt: data.endAt,
              notes: data.notes,
              subscriptionStatus: data.subscriptionStatus,
              metaData: subscription,
            };
            let subscriptionCreated =
              await this.subscriptionService.subscription(
                subscriptionData,
                token
              );
            let mandateData = {
              sourceId: subscriptionCreated._id,
              userId: token.id,
              paymentMethod: "UPI",
              amount: body.amount,
              currency: body.currency,
              frequency: body.frequency,
              mandateStatus: body.mandateStatus,
              status: body.status,
              metaData: body.metaData,
              startDate: body.startDate,
              endDate: body.endDate,
            };
            await this.mandateService.addMandate(mandateData, token);

            let response = {
              subscriptionDetails: subscription,
              authorizationDetails: auth,
            };
            return response;
          },
        };
      default:
        throw new Error(`Invalid subscription provider: ${providerName}`);
    }
  }
}

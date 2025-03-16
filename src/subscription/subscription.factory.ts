import { Injectable } from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HttpService } from "@nestjs/axios";
import { SubscriptionProvider } from "./subscription.interface";
import { HelperService } from "src/helper/helper.service";

@Injectable()
export class SubscriptionFactory {
  constructor(private readonly helperService: HelperService) {}

  getProvider(providerName: string): SubscriptionProvider {
    switch (providerName) {
      case "razorpay":
        return {
          createSubscription: async (data: any, token: UserToken) => {
            // Razorpay API Integration
            const response = await this.helperService.addSubscription(data,token)
            return response;
          },
        };
      case "cashfree":
        return {
          createSubscription: async (data: any, token: UserToken) => {
            // Cashfree API Integration
            const response = await this.helperService.createSubscription(data,token)
            return response;
          },
        };
      default:
        throw new Error(`Invalid subscription provider: ${providerName}`);
    }
  }
}

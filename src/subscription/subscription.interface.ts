import { UserToken } from "src/auth/dto/usertoken.dto";

export interface SubscriptionProvider {
  createSubscription(data: any, bodyData: any, token: UserToken): Promise<any>;
}

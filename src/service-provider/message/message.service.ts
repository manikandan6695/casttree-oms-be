import { Injectable } from "@nestjs/common";
import { ServiceProviderHelperService } from "src/service-provider-helper/service-provider-helper.service";

@Injectable()
export class MessageProviderService {
  constructor(private service_provider_helper: ServiceProviderHelperService) {}

  async sendSMS(params, organization_id: string) {
    try {
      return await this.service_provider_helper.sendSMSUsingOrg(
        organization_id,
        params
      );
    } catch (err) {
      throw err;
    }
  }
}

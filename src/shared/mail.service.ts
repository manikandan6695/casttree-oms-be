import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { ISystemConfigurationModel } from "./schema/system-configuration.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel("systemConfiguration")
    private readonly systemConfigurationModel: Model<ISystemConfigurationModel>
  ) { }

  async getEmails() {
    try {
      const getEmails = await this.systemConfigurationModel.findOne({ key: "error-email-alert" });
      const emails = getEmails.value.map((email: any) => ({
        name: "Email Alert",
        email: email,
      }));
        return emails;
    } catch (error) {
      console.error("Error getting emails:", error);
      throw error;
    }
  }

  async sendErrorLog(subject: string, templateVariables: any) {
    try {
      const emails = await this.getEmails();
      const emailData = {
        to: emails,
        from: {
          name: "Casttree Backend",
          email: "alerts@casttree.in",
        },
        domain: "mail.casttree.in", // Make sure this domain is verified in MSG91
        mail_type_id: "1", // 1 for Transactional
        template_id: "oms_service_alert",
        variables: templateVariables,
      };

      const response = await axios.post(
        this.configService.get("MSG91_EMAIL_END_POINT"),
        emailData,
        {
          headers: {
            Authkey: this.configService.get("MSG91_AUTHKEY"),
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error sending email via MSG91:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

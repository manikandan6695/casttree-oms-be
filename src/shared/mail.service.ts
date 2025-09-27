import { Injectable } from "@nestjs/common";
import axios from "axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ISystemConfigurationModel } from "./schema/system-configuration.schema";
@Injectable()
export class MailService {
  constructor(
    @InjectModel("system-configuration")
    private system_configuration_model: Model<ISystemConfigurationModel>
  ) {}

  async getEmails() {
    const getEmails = await this.system_configuration_model.findOne({
      key: "error-email-alert",
    });
    const emails = getEmails.value.map((email: any) => ({
      name: "Email Alert",
      email: email,
    }));
    return emails;
  }

  async sendErrorLog(subject: string, templateVariables: any) {
    try {
      const emails = await this.getEmails();
    //   console.log("emails", emails);
      const emailData = {
        to: emails,
        from: {
          name: "Casttree Backend",
          email: "alerts@casttree.in",
        },
        domain: "mail.casttree.in", // Make sure this domain is verified in MSG91
        mail_type_id: "1", // 1 for Transactional
        template_id: "error_alert_2025",
        variables: templateVariables,
      };
    //   console.log("emailData", process.env.MSG91_EMAIL_END_POINT);
      const response = await axios.post(
        process.env.MSG91_EMAIL_END_POINT,
        emailData,
        {
          headers: {
            Authkey: process.env.MSG91_AUTHKEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Email sent successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error sending email via MSG91:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
  async getSystemConfig(key: string) {
    try {
      let data = await this.system_configuration_model.findOne({ key: key });
      return data;
    } catch (err) {
      throw err;
    }
  }
}

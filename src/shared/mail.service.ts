import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HelperService } from "src/helper/helper.service";
import axios from "axios";

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly helperService: HelperService
  ) {}

  async getEmails() {
    const getEmails =
      await this.helperService.getSystemConfigs("error-email-alert");
    const emails = getEmails.value.map((email: any) => ({
      name: "Email Alert",
      email: email,
    }));
    return emails;
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
        template_id: "error_alert_2025",
        variables: templateVariables,
      };

      const response = await axios
        .post(this.configService.get("MSG91_EMAIL_END_POINT"), emailData, {
          headers: {
            Authkey: this.configService.get("MSG91_AUTHKEY"),
            "Content-Type": "application/json",
          },
        })

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
}

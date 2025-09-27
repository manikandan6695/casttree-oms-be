import { Injectable } from "@nestjs/common";
import { MailService } from "./mail.service";
// import { CustomLogger } from "src/logger/customlogger.service";

@Injectable()
export class AlertService {
  constructor(
    private readonly mailService: MailService,
    // private readonly logger: CustomLogger
  ) {}

  async sendManualAlert(subject: string, message: string, context?: string) {
    try {
      const templateVariables = {
        service: "Casttree-oms Backend (Manual Alert)",
        path: "Manual Alert",
        method: "MANUAL",
        user_agent: "System Generated",
        ip: "N/A",
        status: "200",
        error_type: "Manual Alert",
        error_message: message,
        headers: "N/A",
        params: "N/A",
        query: "N/A",
        body: "N/A",
        stack_trace: context || "Manual alert triggered",
        timestamp: new Date().toISOString(),
        sender_name: "Casttree (Manual Alert)",
        sender_email: "alerts@casttree.in",
        sender_contact: "+91-8015584624",
      };

      const result = await this.mailService.sendErrorLog(subject, templateVariables);
      
    //   this.logger.log(`Manual alert sent: ${subject}`, "AlertService");
      
      return {
        success: true,
        message: "Alert sent successfully",
        data: result
      };
    } catch (error) {
    //   this.logger.error(`Failed to send manual alert: ${error.message}`, "AlertService");
      throw error;
    }
  }

  async getAlertConfiguration() {
    try {
      const config = await this.mailService.getSystemConfig("error-email-alert");
      return {
        success: true,
        data: config
      };
    } catch (error) {
    //   this.logger.error(`Failed to get alert configuration: ${error.message}`, "AlertService");
      throw error;
    }
  }

  async testAlert() {
    return this.sendManualAlert(
      "🧪 Test Alert - CASTTREE-OMS",
      "This is a test alert to verify the alert system is working correctly.",
      "Test alert triggered from AlertService"
    );
  }
}

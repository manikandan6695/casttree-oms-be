import { HttpService } from "@nestjs/axios";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import * as AWS from "aws-sdk";
import { Model } from "mongoose";
import { CustomLogger } from "src/logger/customlogger.service";
import { ESPAppType } from "src/service-provider/enum/app-type.enum";
import { EMessageProvider } from "src/service-provider/enum/message-provider.enum";
import {
  IAppFieldValueModel,
  IApplicationCredentialModel,
} from "src/service-provider/schema/app-credential.schema";
import { IDefaultApplicationCredentialModel } from "src/service-provider/schema/default-app-credential.schema";
import { AppException } from "src/shared/app-exception";
import { SharedService } from "src/shared/shared.service";
import { SendSMSModel } from "./model/amazon-sns-envelop.model";

var ses = require("node-ses");
@Injectable()
export class ServiceProviderHelperService {
  constructor(
    @InjectModel("default-application-credential")
    private default_app_credential_model: Model<IDefaultApplicationCredentialModel>,
    @InjectModel("applicationCredential")
    private app_credential_model: Model<IApplicationCredentialModel>,
    private shared_service: SharedService,
    private custom_logger: CustomLogger,
    private http_service: HttpService,
    private config_service: ConfigService
    // private mailer_service: MailerService
  ) {}

  async getSystemSMSCred() {
    try {
      let default_sms_cred = await this.default_app_credential_model.findOne({
        type_key: ESPAppType.sms,
        is_primary: true,
      });
      if (!default_sms_cred)
        throw new AppException(
          "Message provider not configured",
          HttpStatus.NOT_FOUND
        );
      return default_sms_cred;
    } catch (err) {
      throw err;
    }
  }

  async getSystemEmailCred() {
    try {
      let default_sms_cred = await this.default_app_credential_model.findOne({
        type_key: ESPAppType.email,
        is_primary: true,
      });
      if (!default_sms_cred)
        throw new AppException(
          "Message provider not configured",
          HttpStatus.NOT_FOUND
        );
      return default_sms_cred;
    } catch (err) {
      throw err;
    }
  }

  async getOrgSMSDetail(organization_id: string) {
    try {
      let cred = await this.app_credential_model.findOne({
        organization_id,
        type_key: ESPAppType.sms,
        is_primary: true,
      });
      if (!cred)
        throw new AppException(
          "Message provider not configured",
          HttpStatus.NOT_FOUND
        );
      return cred;
    } catch (err) {
      throw err;
    }
  }

  async getSMSInstance(
    application_key: string,
    field_values: IAppFieldValueModel[]
  ) {
    try {
      let provider_instance;
      let provider = application_key;
      let provider_values = {};
      switch (application_key) {
        case EMessageProvider.amazon_sns:
          let AMAZON_KEY;
          let AMAZON_SECRET;
          let REGION;
          field_values.forEach((e) => {
            if (e.field_key == "AMAZON_KEY") {
              AMAZON_KEY = this.shared_service.decryptMessage(e.field_value);
            }
            if (e.field_key == "AMAZON_SECRET") {
              AMAZON_SECRET = this.shared_service.decryptMessage(e.field_value);
            }
            if (e.field_key == "REGION") {
              REGION = this.shared_service.decryptMessage(e.field_value);
            }
          });
          provider_instance = new AWS.SNS({
            apiVersion: "2010-12-01",
            accessKeyId: AMAZON_KEY,
            secretAccessKey: AMAZON_SECRET,
            region: REGION,
          });
          break;
        case EMessageProvider.msg91:
          field_values.forEach((e) => {
            if (e.field_key == "TEMPLATE_ID") {
              // provider_values["template_id"] =
              //   this.shared_service.decryptMessage(e.field_value);
              provider_values["template_id"] = e.field_value;
            }
            if (e.field_key == "SENDER") {
              // provider_values["sender"] = this.shared_service.decryptMessage(
              //   e.field_value
              // );
              provider_values["sender"] = e.field_value;
            }
            if (e.field_key == "AUTH_KEY") {
              // provider_values["authkey"] = this.shared_service.decryptMessage(
              //   e.field_value
              // );
              provider_values["authkey"] = e.field_value;
            }

            if (e.field_key == "PRODUCT") {
              // provider_values["product"] = this.shared_service.decryptMessage(
              //   e.field_value
              // );
              provider_values["product"] = e.field_value;
            }
          });
          break;
        default:
          break;
      }
      return { provider, provider_instance, provider_values };
    } catch (err) {
      throw err;
    }
  }

  async sendSMS(
    message_provider: string,
    provider_instance: any,
    params: SendSMSModel,
    provider_values: any
  ) {
    try {
      let sms_dispatch_response;
      if (message_provider == EMessageProvider.amazon_sns) {
        sms_dispatch_response = await provider_instance
          .publish({
            Message: params.message_content,
            PhoneNumber: params.phone_number,
          })
          .promise();
      } else if (message_provider == EMessageProvider.msg91) {
      //  console.log("provider_values", provider_values);

        let res = await this.http_service
          .post(
            this.config_service.get("MSG91_END_POINT"),
            {
              template_id: provider_values.template_id,
              sender: provider_values.sender,
              short_url: "0",
              recipients: [
                {
                  mobiles: params.phone_number,
                  otp: params.otp,
                  product: provider_values.product,
                },
              ],
            },
            { headers: { authkey: provider_values.authkey } }
          )
          .toPromise();

        sms_dispatch_response = res.data;
      }
    //  console.log("sms response", sms_dispatch_response);

      this.custom_logger.debug(sms_dispatch_response, this.constructor.name);
      return { message_provider, sms_response: sms_dispatch_response };
    } catch (err) {
      this.custom_logger.error(err, { label: this.constructor.name });
      throw err;
    }
  }

  async sendSMSUsingOrg(organization_id: string, params: SendSMSModel) {
    try {
      let cred: IApplicationCredentialModel =
        await this.getOrgSMSDetail(organization_id);
      let sms_obj = await this.getSMSInstance(
        cred.application_key,
        cred.field_values
      );
      await this.sendSMS(
        sms_obj.provider,
        sms_obj.provider_instance,
        params,
        sms_obj.provider_values
      );
    } catch (err) {
      throw err;
    }
  }

  async sendSystemSMS(params: SendSMSModel) {
    try {
      let cred: IDefaultApplicationCredentialModel =
        await this.getSystemSMSCred();
      let sms_obj = await this.getSMSInstance(
        cred.application_key,
        cred.field_values
      );

      return await this.sendSMS(
        sms_obj.provider,
        sms_obj.provider_instance,
        params,
        sms_obj.provider_values
      );
    } catch (err) {
      throw err;
    }
  }

  // async sendSystemMail(params: SendEmailModel) {
  //   try {
  //     let cred: IDefaultApplicationCredentialModel = await this.getSystemEmailCred();
  //     let mail_obj = await this.getEmailInstance(
  //       cred.application_key,
  //       cred.field_values
  //     );

  //     return await this.mailer_service.sendLoginOTP(
  //       params,
  //       mail_obj.mail_instance,
  //       mail_obj.mail_type,
  //       mail_obj.mail_provider_values
  //     );
  //   } catch (err) {
  //     throw err;
  //   }
  // }
  // async getEmailInstance(
  //   application_key: string,
  //   field_values: IAppFieldValueModel[]
  // ) {
  //   let mail_instance;
  //   let mail_type = application_key;
  //   let mail_provider_values = {};
  //   switch (application_key) {
  //     case EMailerType.gmail:
  //       var GMAIL_KEY;
  //       var GMAIL_SECRET;

  //       field_values.forEach((e) => {
  //         if (e.field_key == "GMAIL_KEY") {
  //           mail_provider_values["GMAIL_KEY"] =
  //             this.shared_service.decryptMessage(e.field_value);
  //         }
  //         if (e.field_key == "GMAIL_SECRET") {
  //           mail_provider_values["GMAIL_SECRET"] =
  //             this.shared_service.decryptMessage(e.field_value);
  //         }
  //       });

  //       mail_instance = nodemailer.createTransport({
  //         service: EMailerType.gmail,
  //         auth: {
  //           user: mail_provider_values["GMAIL_KEY"],
  //           pass: mail_provider_values["GMAIL_SECRET"],
  //         },
  //       });
  //       break;
  //     case EMailerType.amazon_ses:
  //       let AMAZON_KEY;
  //       let AMAZON_SECRET;
  //       let REGION;
  //       field_values.forEach((e) => {
  //         if (e.field_key == "AMAZON_KEY") {
  //           mail_provider_values["AMAZON_KEY"] =
  //             this.shared_service.decryptMessage(e.field_value);
  //         }
  //         if (e.field_key == "AMAZON_SECRET") {
  //           mail_provider_values["AMAZON_SECRET"] =
  //             this.shared_service.decryptMessage(e.field_value);
  //         }
  //         if (e.field_key == "REGION") {
  //           mail_provider_values["REGION"] = this.shared_service.decryptMessage(
  //             e.field_value
  //           );
  //         }
  //         if (e.field_key == "EMAIL") {
  //           mail_provider_values["EMAIL"] = this.shared_service.decryptMessage(
  //             e.field_value
  //           );
  //         }
  //       });
  //       mail_instance = ses.createClient({
  //         key: AMAZON_KEY,
  //         secret: AMAZON_SECRET,
  //         region: REGION,
  //       });
  //       break;
  //     default:
  //       break;
  //   }

  //   return { mail_instance, mail_type, mail_provider_values };
  // }
}

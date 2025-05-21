// import { HttpStatus, Injectable } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model } from "mongoose";
// import { AuthService } from "src/auth/auth.service";
// import { AppException } from "src/shared/app-exception";
// import { EDefaultAddonKey } from "src/shared/enum/default-addon-key.enum";
// import { EStatus } from "src/shared/enum/privacy.enum";
// import { SubscriptionHelperService } from "src/subscription-helper/subscription-helper.service";
// import { UserToken } from "src/user/dto/usertoken.dto";
// import { CreateGSTSettingsDTO } from "./dto/create-gst-settings.dto";
// import { StatusDTO, UpdateGSTSettingsDTO } from "./dto/update-gst-settings.dto";
// import { IGSTSettingsModel } from "./schema/gst-settings.schema";

// @Injectable()
// export class GstSettingsService {
//   constructor(
//     @InjectModel("gstSettings")
//     private gst_settings_model: Model<IGSTSettingsModel>,
//     private subscription_helper_service: SubscriptionHelperService,
//     private auth_service: AuthService
//   ) {}

//   async validateGSTCounts(organization_id: string, product_key: string) {
//     try {
//       let subscription_id = await this.auth_service.getOrganizationSubscription(
//         organization_id,
//         product_key
//       );
//       let applicable_count = await this.subscription_helper_service.getApplicableAddonCount(
//         subscription_id,
//         EDefaultAddonKey.gst_in
//       );

//       if (!applicable_count)
//         throw new AppException(
//           "You dont have suitable plan to create GSTIN",
//           HttpStatus.NOT_ACCEPTABLE
//         );
//       let total_gstin = await this.gst_settings_model.countDocuments({
//         organization_id,
//         status: EStatus.Active,
//       });
//       console.log("applicable_count ", applicable_count, total_gstin);
//       if (!(total_gstin < applicable_count.count)) {
//         throw new AppException(
//           "You have reached the limit to create GSTIN",
//           HttpStatus.NOT_ACCEPTABLE
//         );
//       }
//     } catch (err) {
//       throw err;
//     }
//   }

//   async createGSTSettings(
//     token: UserToken,
//     body: CreateGSTSettingsDTO,
//     organization_id: string,
//     product_key: string,
//     skip_check: boolean = false
//   ) {
//     try {
//       if (!skip_check)
//         await this.validateGSTCounts(organization_id, product_key);
//       let gstin = await this.gst_settings_model.findOne({
//         organization_id,
//         gstin: body.gstin,
//       });
//       if (gstin) {
//         throw new AppException(
//           "GSTIN already exist",
//           HttpStatus.NOT_ACCEPTABLE
//         );
//       }
//       let fv = {
//         organization_id: organization_id,
//         gstin: body.gstin,
//         business_location: body.business_location,
//         gst_reg_on: body.gst_reg_on,
//         reverse_charges: body.reverse_charges,
//         composition_scheme: body.composition_scheme,
//         composition_scheme_percentage: body.composition_scheme_percentage,
//         composition_scheme_value: body.composition_scheme_value,
//         import_export: body.import_export,
//         custom_duty_tracking_account: body.custom_duty_tracking_account,
//         digital_services: body.digital_services,
//         created_by: token.id,
//         updated_by: token.id,
//       };
//       let data = await this.gst_settings_model.create(fv);
//       return data;
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getGSTSettingsList(filters: any) {
//     try {
//       let filter = filters.fitlerCriteria;
//       let data = await this.gst_settings_model
//         .find(filter)
//         .sort({ _id: -1 })
//         .populate("business_location");
//       return data;
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getGSTSettingsDetail(id: string) {
//     try {
//       let data = await this.gst_settings_model
//         .findOne({ _id: id })
//         .populate("business_location")
//         .populate("custom_duty_tracking_account", "account_name _id");
//       return data;
//     } catch (err) {
//       throw err;
//     }
//   }

//   async updateGSTSettings(
//     id: string,
//     body: UpdateGSTSettingsDTO,
//     token: any,
//     organization_id: string
//   ) {
//     try {
//       let gstin = await this.gst_settings_model.findOne({
//         _id: { $ne: id },
//         organization_id,
//         gstin: body.gstin,
//       });
//       if (gstin) {
//         throw new AppException(
//           "GSTIN already exist",
//           HttpStatus.NOT_ACCEPTABLE
//         );
//       }
//       await this.gst_settings_model.updateOne(
//         { _id: id, organization_id: organization_id },
//         { $set: { ...body, updated_by: token.id } }
//       );
//       return { message: "Updated Successfully" };
//     } catch (err) {
//       throw err;
//     }
//   }

//   async markAsInactive(
//     id: string,
//     body: StatusDTO,
//     token: any,
//     organization_id: string,
//     product_key: string
//   ) {
//     try {
//       let old_data = await this.gst_settings_model.findOne({
//         organization_id,
//         _id: id,
//       });
//       if (
//         old_data.status == EStatus.Inactive &&
//         body.status == EStatus.Active
//       ) {
//         await this.validateGSTCounts(organization_id, product_key);
//       }
//       await this.gst_settings_model.updateOne(
//         { _id: id, organization_id: organization_id },
//         { $set: { ...body, updated_by: token.id } }
//       );
//       return { message: "Updated Successfully" };
//     } catch (err) {
//       throw err;
//     }
//   }

//   async getBranchInitialData(body: any, organization_id: string) {
//     try {
//       let filter = {};
//       if (body.state_id) {
//         filter["business_location"] = body.state_id;
//         filter["organization_id"] = organization_id;
//         filter["status"] = "Active";
//       } else {
//         filter["organization_id"] = organization_id;
//         filter["status"] = "Active";
//       }
//       let data = await this.gst_settings_model.find(filter, {
//         gstin: 1,
//         _id: 1,
//       });
//       return data;
//     } catch (err) {
//       throw err;
//     }
//   }
// }

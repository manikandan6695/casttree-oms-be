// import * as mongoose from "mongoose";
// import { ESProductKey } from "src/auth/enum/product-key.enum";
// import { IMedia } from "src/media/schema/media.schema";
// import { ESStatus, EStatus } from "src/shared/enum/privacy.enum";
// import { IUserModel, MediaSchema } from "src/user/schema/user.schema";
// import { IApplicationTypeModel } from "./app-type.schema";

// export interface IAppFieldModel {
//   field_name: string;
//   field_key: string;
// }

// export interface IApplicationModel extends mongoose.Document {
//   type_id: string | IApplicationTypeModel;
//   type_key: string;
//   application_name: string;
//   application_key: string;
//   short_description?: string;
//   long_description?: string;
//   media?: IMedia[];
//   fields: IAppFieldModel[];
//   status: EStatus;
//   created_by?: string | IUserModel;
//   updated_by?: string | IUserModel;
//   supported_products: any[];
// }

// export const AppFieldSchema = new mongoose.Schema({
//   field_name: { type: String },
//   field_key: { type: String },
// });

// export const ApplicationSchema = new mongoose.Schema(
//   {
//     type_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "applicationType",
//     },
//     type_key: {
//       type: String,
//     },
//     application_name: {
//       type: String,
//     },
//     application_key: {
//       type: String,
//       unique: true,
//     },
//     short_description: {
//       type: String,
//     },
//     long_description: {
//       type: String,
//     },
//     media: [MediaSchema],
//     fields: [AppFieldSchema],
//     status: { type: String, enum: ESStatus, default: "Active" },
//     created_by: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "user",
//     },
//     updated_by: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "user",
//     },
//     supported_products: [{ type: String }],
//   },
//   {
//     collection: "application",
//     timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
//   }
// );

// import * as mongoose from "mongoose";
// import { IMedia } from "src/media/schema/media.schema";
// import { IOrganizationModel } from "src/organization/schema/organization.schema";
// import { ESStatus, EStatus } from "src/shared/enum/privacy.enum";
// import { IUserModel, MediaSchema } from "src/user/schema/user.schema";

// export interface IBrand extends mongoose.Document {
//   organization_id: string | IOrganizationModel;
//   brand_name: string;
//   brand_description?: string;
//   media: IMedia[];
//   status?: EStatus;
//   created_by: string | IUserModel;
//   updated_by: string | IUserModel;
//   created_at?: string | Date;
//   updated_at?: string | Date;
// }

// export const BrandSchema = new mongoose.Schema<any>(
//   {
//     organization_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "organization",
//     },
//     brand_name: {
//       type: String,
//     },
//     brand_description: {
//       type: String,
//     },
//     media: [MediaSchema],
//     status: { type: String, enum: ESStatus, default: "Active" },
//     created_by: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "user",
//     },
//     updated_by: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "user",
//     },
//   },
//   {
//     collection: "brand",
//     timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
//   }
// );

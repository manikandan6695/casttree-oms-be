import mongoose from "mongoose";
export interface IRule {
  isSubscribed: boolean;
}
export interface IBannerConfiguration extends mongoose.Document {
  banner: any;
  navigation: any;
  key: string;
  rule: IRule;
  status: string;
}
export const RuleSchema = new mongoose.Schema({
  isSubscribed: {
    type: Boolean,
  },
});
export const BannerConfigurationSchema = new mongoose.Schema(
  {
    banner: { type: mongoose.Schema.Types.Mixed },
    navigation: { type: mongoose.Schema.Types.Mixed },
    rule: RuleSchema,
    key: { type: String },
    status: {
      type: String,
      default: "Active",
    },
  },
  {
    collection: "bannerConfiguration",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

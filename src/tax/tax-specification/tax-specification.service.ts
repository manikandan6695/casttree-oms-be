// import { Injectable } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model } from "mongoose";
// import { ITaxSpecificationModel } from "../schema/tax-specification.schema";

// @Injectable()
// export class TaxSpecificationService {
//   constructor(
//     @InjectModel("taxSpecification")
//     private tax_spec_model: Model<ITaxSpecificationModel>
//   ) {}
//   async getTaxSpec(organization_country: string) {
//     try {
//       console.log("organization_country is", organization_country);
//       let data = await this.tax_spec_model
//         .find({ country: organization_country })
//         .populate("tax_types");
//       return { data };
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getTaxSpecifications(
//     organization_country: string,
//     tax_specification_ids: string[]
//   ) {
//     try {
//       console.log("organization_country is", organization_country);
//       let data = await this.tax_spec_model
//         .find({
//           country: organization_country,
//           _id: { $in: tax_specification_ids },
//         })
//         .populate("tax_types");
//       return { data };
//     } catch (err) {
//       throw err;
//     }
//   }
// }

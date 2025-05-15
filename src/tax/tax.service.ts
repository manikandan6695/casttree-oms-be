// import { HttpStatus, Injectable } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model } from "mongoose";
// import { IItemModel } from "src/item/schema/item.schema";
// import { IItemDocumentModel } from "src/sales-document/schema/item-document.schema";
// import { AppException } from "src/shared/app-exception";
// import { ETaxExemptionsType } from "src/tax-exemptions/enum/tax-exemption.enum";
// import { ITaxExemptionsModel } from "src/tax-exemptions/schema/tax-exemptions.schema";
// import { AssociateTaxDTO } from "./dto/associate-tax.dto";
// import { CreateTaxDTO } from "./dto/create-tax.dto";
// import { UpdateTaxDTO } from "./dto/update-tax.dto";
// import { ETaxType } from "./enum/tax.enum";
// import { ITaxTypeModel } from "./schema/tax-type.schema";
// import { ITaxModel } from "./schema/tax.schema";
// import { ETaxSpecification } from "./tax-specification/enum/tax-specification.enum";
// import { TaxSpecificationService } from "./tax-specification/tax-specification.service";

// @Injectable()
// export class TaxService {
//   constructor(
//     @InjectModel("tax")
//     private tax_model: Model<ITaxModel>,
//     @InjectModel("item")
//     private item_model: Model<IItemModel>,
//     @InjectModel("itemDocument")
//     private item_document_model: Model<IItemDocumentModel>,
//     @InjectModel("taxType")
//     private tax_type_model: Model<ITaxTypeModel>,
//     @InjectModel("taxExemptions")
//     private tax_exemptions_model: Model<ITaxExemptionsModel>,
//     private tax_specification_service: TaxSpecificationService
//   ) {}

//   async addTax(body: CreateTaxDTO, token: any, organization_id) {
//     try {
//       let fv;
//       if (body.type == ETaxType.Group) {
//         if (body.taxes.length < 2) {
//           throw new AppException(
//             "Select atleast two taxes",
//             HttpStatus.NOT_ACCEPTABLE
//           );
//         }
//         let grouping = await this.tax_model
//           .find({ _id: { $in: body.taxes } })
//           .populate("taxes");

//         let total_tax_rate = grouping
//           .map((o) => o.tax_rate)
//           .reduce((a, c) => {
//             return a + c;
//           });

//         fv = {
//           organization_id: organization_id,
//           tax_name: body.tax_name,
//           type: body.type,
//           tax_rate: total_tax_rate,
//           taxes: body.taxes,
//           created_by: token.id,
//           updated_by: token.id,
//         };
//       }

//       if (body.type == ETaxType.Single) {
//         let tax = await this.tax_model.findOne({
//           organization_id: organization_id,
//           tax_name: body.tax_name,
//           tax_type: body.tax_type,
//           tax_rate: body.tax_rate,
//         });
//         if (tax) {
//           throw new AppException(
//             "Tax already exist",
//             HttpStatus.NOT_ACCEPTABLE
//           );
//         }
//         fv = {
//           organization_id: organization_id,
//           tax_name: body.tax_name,
//           type: body.type,
//           tax_rate: body.tax_rate,
//           tax_type: body.tax_type,
//           created_by: token.id,
//           updated_by: token.id,
//         };
//       }
//       let added_tax = await this.tax_model.create(fv);
//       return added_tax;
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getTaxList(skip: number, limit: number, organization_id: any) {
//     try {
//       let tax = await this.tax_model
//         .find({ organization_id: organization_id })
//         .populate("tax_type")
//         .sort("-created_at")
//         .skip(skip)
//         .limit(limit);
//       let tax_count = await this.tax_model.countDocuments({
//         organization_id: organization_id,
//       });
//       return { tax, tax_count };
//     } catch (err) {
//       throw err;
//     }
//   }

//   async getSingleTax(id) {
//     try {
//       let tax = await this.tax_model
//         .findOne({ _id: id })
//         .lean()
//         .populate("tax_type");
//       let tax_data = await this.tax_model.find({
//         taxes: { $in: [id] },
//         type: ETaxType.Group,
//       });
//       var flag;
//       if (tax_data.length) flag = true;
//       tax["tax_group"] = flag;
//       return tax;
//     } catch (err) {
//       throw err;
//     }
//   }
//   async updateTax(id: string, body: UpdateTaxDTO, organization_id: string) {
//     try {
//       if (body.type == ETaxType.Single) {
//         console.log("inside single");
//         let tax = await this.tax_model.findOne({
//           _id: { $ne: id },
//           organization_id: organization_id,
//           tax_name: body.tax_name,
//           tax_type: body.tax_type,
//           tax_rate: body.tax_rate,
//         });
//         if (tax) {
//           throw new AppException(
//             "Tax already exist",
//             HttpStatus.NOT_ACCEPTABLE
//           );
//         }
//         await this.tax_model.updateOne(
//           { _id: id, type: ETaxType.Single, organization_id: organization_id },
//           { $set: body }
//         );
//         let tax_data = await this.tax_model
//           .find({ taxes: { $in: [id] } })
//           .populate("taxes");
//         // console.log("tax data is", JSON.stringify(tax_data));

//         if (tax_data.length) {
//           for (let i = 0; i < tax_data.length; i++) {
//             let tax = tax_data[i].taxes.map((e) => e.tax_rate);
//             let updated_data = tax.reduce((a, c) => {
//               return a + c;
//             }, 0);
//             await this.tax_model.updateOne(
//               {
//                 _id: tax_data[i]._id,
//                 organization_id: organization_id,
//                 type: ETaxType.Group,
//               },
//               {
//                 tax_rate: updated_data,
//               }
//             );
//           }
//         }
//       }

//       if (body.type == ETaxType.Group) {
//         console.log("inside group");
//         let grouping = await this.tax_model.find({
//           _id: { $in: body.taxes },
//         });
//         let updated_tax_rate = grouping
//           .map((o) => o.tax_rate)
//           .reduce((a, c) => {
//             return a + c;
//           });

//         await this.tax_model.updateOne(
//           { _id: id, type: ETaxType.Group },
//           {
//             tax_rate: updated_tax_rate,
//             tax_name: body.tax_name,
//             taxes: body.taxes,
//           }
//         );
//       }

//       let updated_tax = await this.tax_model.findOne({
//         _id: id,
//         organization_id: organization_id,
//       });
//       return updated_tax;
//     } catch (err) {
//       throw err;
//     }
//   }

//   async checkItemTax(tax_id: string) {
//     try {
//       let item_tax = await this.item_model.findOne({
//         "item_taxes.item_tax_id": tax_id,
//       });
//       return item_tax;
//     } catch (err) {
//       throw err;
//     }
//   }

//   async deleteTax(id) {
//     try {
//       let group_data = await this.tax_model
//         .find({ taxes: { $in: [id] }, type: ETaxType.Group })
//         .populate("taxes");
//       let item_data = await this.checkItemTax(id);
//       let item_document_tax = await this.checkItemDocumentTax(id, null);
//       if (group_data.length) {
//         throw new AppException(
//           "Tax can't be delete associated with group",
//           HttpStatus.NOT_ACCEPTABLE
//         );
//       }
//       if (item_data) {
//         throw new AppException(
//           "Tax can't be delete associated with item",
//           HttpStatus.NOT_ACCEPTABLE
//         );
//       }
//       if (item_document_tax) {
//         throw new AppException(
//           "Tax can't be delete",
//           HttpStatus.NOT_ACCEPTABLE
//         );
//       }
//       let remove_tax = await this.tax_model.deleteOne({ _id: id });
//       return { message: "Deleted Successfully" };
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getTaxTypes(body: any, country) {
//     try {
//       let filters = { country };
//       if (body.search) {
//         filters["tax_name"] = new RegExp(body.search, "i");
//       }
//       let data = await this.tax_type_model.find(filters);
//       return data;
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getAssociateTax(body: AssociateTaxDTO) {
//     try {
//       let filters = {};
//       filters["type"] = body.type;

//       let data = await this.tax_model
//         .find(filters)
//         .populate("tax_type")
//         .sort("-created_at")
//         .skip(body.skip)
//         .limit(body.limit);

//       return data;
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getTaxes(organization_id) {
//     try {
//       let tax_exemption = await this.tax_exemptions_model.find({
//         organization_id: organization_id,
//         type: ETaxExemptionsType.Item,
//       });
//       let taxes = await this.tax_model.find({
//         organization_id: organization_id,
//         type: ETaxType.Single,
//       });
//       let tax_group = await this.tax_model
//         .find({
//           organization_id: organization_id,
//           type: ETaxType.Group,
//         })
//         .populate("taxes");

//       return { tax_exemption, taxes, tax_group };
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getTaxType(organization_id: string, tax_id: string) {
//     try {
//       let tax = await this.tax_model
//         .findOne({ organization_id, _id: tax_id })
//         .populate("tax_type");
//       if (!tax) return null;
//       let tax_type = tax.tax_type as ITaxTypeModel;
//       return tax_type;
//     } catch (err) {
//       throw err;
//     }
//   }
//   async checkItemDocumentTax(tax_id: string, tax_exemption_id: string) {
//     try {
//       if (tax_id) {
//         let item_document_tax = await this.item_document_model.findOne({
//           "item_tax.tax_id": tax_id,
//         });
//         return item_document_tax;
//       }
//       if (tax_exemption_id) {
//         let item_document_tax_exemption = await this.item_document_model.findOne(
//           {
//             "item_tax.tax_id": tax_exemption_id,
//           }
//         );
//         return item_document_tax_exemption;
//       }
//     } catch (err) {
//       throw err;
//     }
//   }
//   async getSpecificationTax(
//     tax_specification_id: string[],
//     organization_id: string,
//     organization_country: string
//   ) {
//     try {
//       let taxSpecifications = await this.tax_specification_service.getTaxSpecifications(
//         organization_country,
//         tax_specification_id
//       );
//       // console.log("tax specifaction", taxSpecifications);
//       let tax_data = {};
//       for (let i = 0; i < taxSpecifications.data.length; i++) {
//         let cur_data = taxSpecifications.data[i];
//         if (cur_data.tax_specification_name == ETaxSpecification.inter) {
//           // console.log("inter state", cur_data.applicable_tax_types);

//           let tax_type = await this.tax_type_model.findOne({
//             tax_id: { $in: cur_data.applicable_tax_types },
//           });
//           // console.log("tax type is", tax_type, organization_id);
//           let tax = await this.tax_model
//             .find({
//               tax_type: tax_type._id,
//               organization_id,
//               type: ETaxType.Single,
//             })
//             .populate("tax_type");
//           // console.log("tax is", tax);
//           tax_data[cur_data._id] = tax;
//         }
//         if (cur_data.tax_specification_name == ETaxSpecification.intra) {
//           let tax = await this.tax_model.find({
//             type: ETaxType.Group,
//             organization_id,
//           });
//           tax_data[cur_data._id] = tax;
//         }
//       }
//       // console.log("tax data is", tax_data);

//       return tax_data;
//     } catch (err) {
//       throw err;
//     }
//   }
// }

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ItemDocumentService } from "src/item-document/item-document.service";
import { SharedService } from "src/shared/shared.service";
import { EDocumentTypeName } from "./enum/document-type-name.enum";
import { ISalesDocumentModel } from "./schema/sales-document.schema";
import { ItemService } from "src/item/item.service";
import { IItemModel } from "src/item/schema/item.schema";
//import { OnModuleInit } from "@nestjs/common";
const { ObjectId } = require("mongodb");

@Injectable()
export class InvoiceService{
  constructor(
    @InjectModel("salesDocument")
    private readonly salesDocumentModel: Model<ISalesDocumentModel>,
    @InjectModel("item")
    private readonly itemModel: Model<IItemModel>,
    private configService: ConfigService,
    private sharedService: SharedService,
    private itemDocumentService: ItemDocumentService
    // @Inject(forwardRef(() => ItemService))
    // private itemService: ItemService
  ) {
    this.calculateGST("6788a5ceecf6b05434b9b6ad", 1800);
  }

// async onModuleInit() {
//   try {
//     const itemId = "6788a5ceecf6b05434b9b6ad";

//     // Fetch item and get price
//     const item = await this.itemModel.findById(itemId).lean() as any;
//     const priceFromDb = item?.price;

//     if (priceFromDb === undefined || priceFromDb === null) {
//       console.log("Price not found in DB, skipping GST calculation.");
//       return;
//     }

//     const gstResult = await this.calculateGST(itemId, { grand_total: priceFromDb });

//     console.log("GST Result:", gstResult);
//   } catch (error) {
//     console.error("GST Calculation Error:", error.message);
//   }
// }


async createInvoice(body) {
    try {
      let invoice_sequence = await this.sharedService.getNextNumber(
        "Invoice",
        "INV",
        5,
        null
      );
      let invoice_number = invoice_sequence.toString();
      let invoice = invoice_number.padStart(5, "0");

      const gstData = await this.calculateGST(body.itemId, body);

      let fv = {
        ...body,
      };
      fv["sales_doc_id_prefix"] = "INV";
      fv["sales_document_number"] = invoice;
      fv["document_number"] = invoice;
      fv["amount"] = gstData.amount;
      fv["amount_with_tax"] = gstData.amountWithTax;
      fv["tax_amount"] = gstData.taxAmount;

      let data = await this.salesDocumentModel.create(fv);
      await this.itemDocumentService.createItemDocuments([
        {
          source_id: data._id,
          source_type: EDocumentTypeName.invoice,
          item_id: body.itemId,
          amount: data.sub_total,
          quantity: data.item_count,
          user_id: body.user_id,
          created_by: body.created_by,
          updated_by: body.updated_by,
        },
      ]);
      //  console.log("invoice id", data._id);

      return data;
    } catch (err) {
      throw err;
    }
  }

  async updateInvoice(id: any, status) {
    try {
      let updateBody: any = {};
      updateBody.document_status = status;
      await this.salesDocumentModel.updateOne(
        {
          $or: [{ source_id: id }, { _id: id }],
        },
        { $set: { document_status: status } }
      );
      let invoice = await this.salesDocumentModel.findOne({
        $or: [{ source_id: id }, { _id: id }],
      });
      // console.log("invoice id", invoice);

      return { message: "Updated successfully", invoice };
    } catch (err) {
      throw err;
    }
  }

  async calculateGST(itemId: string, priceIncludingTax: number) {
  try {
    // console.log('Calculating GST for Item ID:', itemId,priceIncludingTax);
    
    const itemId = "6788a5ceecf6b05434b9b6ad"; 
    const itemDetails = await this.getItemDetails(itemId);
    console.log('Fetched Item Details:', itemDetails);

    const taxRateObject = itemDetails?.item_taxes?.find(
      tax => tax.item_tax_id && typeof tax.item_tax_id.tax_rate === 'number'
    );

    if (!taxRateObject) {
      console.log('No tax rate found, returning original amount without tax calculations.');
      return {
        amount: priceIncludingTax.toFixed(2),
        amountWithTax: priceIncludingTax,
        taxAmount: "0.00",
      };
    }

    const gstRate = taxRateObject.item_tax_id.tax_rate;
    console.log('Actual tax rate from DB:', gstRate);

    const amountWithoutTax = priceIncludingTax / (1 + gstRate / 100);
    const taxAmount = priceIncludingTax - amountWithoutTax;

    console.log(`GST Calculation for Item (${itemId}):`);
    console.log("Amount without tax:", amountWithoutTax.toFixed(2));
    console.log("Tax amount:", taxAmount.toFixed(2));

    return {
      amount: amountWithoutTax.toFixed(2),
      amountWithTax: priceIncludingTax,
      taxAmount: taxAmount.toFixed(2),
    };
  } catch (err) {
    throw err;
  }
}

  async getItemDetails(itemId: string) {
    try {
       console.log('Fetching item details for ID:', typeof itemId,itemId);
       const data = await this.itemModel.findOne()
      //  .populate({
      //     path: "item_taxes.item_tax_specification",
      //     model: "taxSpecification",
      //     select: ["tax_specification_name"],
      //   })
      //   .populate({
      //     path: "item_taxes.item_tax_id",
      //     model: "tax",
      //     select: ["tax_name", "tax_rate"],
      //   })
        // .lean();
        console.log("data is", data);
        
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getInvoiceBySource(sourceId: string, sourceType: string) {
    try {
      let invoice = await this.salesDocumentModel.findOne({
        source_id: sourceId,
        source_type: sourceType,
      });

      return invoice;
    } catch (err) {
      throw err;
    }
  }

  async getInvoiceDetail(id: string) {
    try {
      let invoice = await this.salesDocumentModel.findOne({
        _id: id,
      });

      return invoice;
    } catch (err) {
      throw err;
    }
  }
}

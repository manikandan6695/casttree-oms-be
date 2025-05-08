import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ItemDocumentService } from "src/item-document/item-document.service";
import { SharedService } from "src/shared/shared.service";
import { EDocumentTypeName } from "./enum/document-type-name.enum";
import { ISalesDocumentModel } from "./schema/sales-document.schema";
import { ItemService } from "src/item/item.service";
import { log } from "console";

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel("salesDocument")
    private readonly salesDocumentModel: Model<ISalesDocumentModel>,
    private configService: ConfigService,
    private sharedService: SharedService,
    private itemService: ItemService,
    private itemDocumentService: ItemDocumentService
  ) {
  }

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
      const itemId = "6788a5ceecf6b05434b9b6ad";
      const itemDetails = await this.itemService.getItemsDetails([itemId]);
      const gstPercentage = itemDetails?.[0]?.item_taxes?.map(tax => tax.item_tax_id?.tax_rate)?.[0] || 18;
      let gstValues = this.calculateGST(body.grandTotal, gstPercentage);



      let fv = {
        ...body,
      };
      fv["sales_doc_id_prefix"] = "INV";
      fv["sales_document_number"] = invoice;
      fv["document_number"] = invoice;
      fv["amount_without_tax"] = gstValues.amountWithoutTax;
      fv["gst_amount"] = gstValues.taxAmount;


      let data = await this.salesDocumentModel.create(fv);
      await this.itemDocumentService.createItemDocuments([
        {
          source_id: data._id,
          source_type: EDocumentTypeName.invoice,
          item_id: itemId,
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

  private calculateGST(grandTotal: number, gstPercentage: number): { 
    amountWithoutTax: number; 
    taxAmount: number; 
  } {
    const amountWithoutTax = grandTotal / (1 + gstPercentage / 100);
    const taxAmount = grandTotal - amountWithoutTax;
  
    console.log("Amount without tax ==>", amountWithoutTax.toFixed(2));
    console.log("Tax amount ==>", taxAmount.toFixed(2));
  
    return {
      amountWithoutTax: parseFloat(amountWithoutTax.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
    };
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
      console.log("invoice id", invoice);
      
      return { message: "Updated successfully", invoice };
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
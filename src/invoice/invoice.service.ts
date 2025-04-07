import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ItemDocumentService } from "src/item-document/item-document.service";
import { SharedService } from "src/shared/shared.service";
import { EDocumentTypeName } from "./enum/document-type-name.enum";
import { ISalesDocumentModel } from "./schema/sales-document.schema";

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel("salesDocument")
    private readonly salesDocumentModel: Model<ISalesDocumentModel>,
    private configService: ConfigService,
    private sharedService: SharedService,
    private itemDocumentService: ItemDocumentService
  ) {}

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

      let fv = {
        ...body,
      };
      fv["sales_doc_id_prefix"] = "INV";
      fv["sales_document_number"] = invoice;
      fv["document_number"] = invoice;

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
      console.log("invoice id", data._id);

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
        { _id: id },
        { $set: { document_status: status } }
      );
      return { message: "Updated successfully" };
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

  async updateSourceId(
    source_id,source_type,invoiceId
  ){
    try{
      let updateInvoice = await this.salesDocumentModel.updateOne({_id:invoiceId},{$set:{source_id:source_id,source_type:source_type}});
      return updateInvoice;
    }catch(err){throw err}
  }
}

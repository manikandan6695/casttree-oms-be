import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ItemDocumentService } from "src/item-document/item-document.service";
import { SharedService } from "src/shared/shared.service";
import { EDocumentTypeName } from "./enum/document-type-name.enum";
import { EDocumentNumberType } from "./enum/transaction-type.enum";
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

  async createInvoice(body, token) {
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
          item_id: data.source_id,
          amount: data.sub_total,
          quantity: data.item_count,
        },
      ]);
      return data;
    } catch (err) {
      throw err;
    }
  }

  async updateInvoice(id: any, status) {
    try {
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
}

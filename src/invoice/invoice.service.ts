import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SharedService } from "src/shared/shared.service";
import { EDocumentNumberType } from "./enum/transaction-type.enum";
import { ISalesDocumentModel } from "./schema/sales-document.schema";

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel("salesDocument")
    private readonly salesDocumentModel: Model<ISalesDocumentModel>,
    private configService: ConfigService,
    private sharedService: SharedService
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
}

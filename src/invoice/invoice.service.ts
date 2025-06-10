import { HelperService } from "src/helper/helper.service";
import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ItemDocumentService } from "src/item-document/item-document.service";
import { SharedService } from "src/shared/shared.service";
import { EDocumentTypeName } from "./enum/document-type-name.enum";
import { ISalesDocumentModel } from "./schema/sales-document.schema";
import { ItemService } from "src/item/item.service";
import { IItemModel } from "src/item/schema/item.schema";
import { UserToken } from "src/auth/dto/usertoken.dto";
const { ObjectId } = require("mongodb");

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel("salesDocument")
    private readonly salesDocumentModel: Model<ISalesDocumentModel>,
    @InjectModel("item")
    private readonly itemModel: Model<IItemModel>,
    private configService: ConfigService,
    private sharedService: SharedService,
    private itemDocumentService: ItemDocumentService,
    private helperService: HelperService
    // @Inject(forwardRef(() => ItemService))
    // private itemService: ItemService
  ) {}

  async createInvoice(body, userId: string) {
    try {
      const [userData, invoice_sequence] = await Promise.all([
        this.helperService.getUserById(userId),
        this.sharedService.getNextNumber("Invoice", "INV", 5, null),
      ]);

      const countryCode = userData?.data?.country_code;
      const invoice_number = invoice_sequence.toString().padStart(5, "0");

      const fv: any = {
        ...body,
        sales_doc_id_prefix: "INV",
        sales_document_number: invoice_number,
        document_number: invoice_number,
      };

      let gstData;
      if (countryCode === "IN") {
        gstData = await this.calculateGST(body.itemId, body.grand_total);
        fv.tax_amount = gstData.taxAmount.toFixed(2);
      }

      const data = await this.salesDocumentModel.create(fv);

      const itemDocument: any[] = [
        {
          source_id: data._id,
          source_type: EDocumentTypeName.invoice,
          item_id: body.itemId,
          amount: data.sub_total,
          quantity: body.item_count,
          user_id: body.user_id,
          created_by: body.created_by,
          updated_by: body.updated_by,
        },
      ];

      if (countryCode === "IN") {
        const taxDetail =
          gstData?.itemDetails?.item_taxes?.[0]?.item_tax_id || {};
        itemDocument[0]["item_tax_composition"] = [
          {
            tax_id: taxDetail._id,
            amount: gstData?.amountWithTax?.toFixed(2),
            amount_without_tax: gstData?.amount?.toFixed(2),
            tax_amount: gstData?.taxAmount?.toFixed(2),
            tax_name: taxDetail?.tax_rate,
            tax_value: taxDetail?.tax_rate,
          },
        ];
      }

      await this.itemDocumentService.createItemDocuments(itemDocument);

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
      const itemDetails = await this.getItemDetails(itemId);
      const price =
        typeof priceIncludingTax === "string"
          ? parseFloat(priceIncludingTax)
          : priceIncludingTax;
      const gstRate = itemDetails?.item_taxes?.[0]?.item_tax_id?.tax_rate;

      const amount = priceIncludingTax / (1 + gstRate / 100);
      const taxAmount = priceIncludingTax - amount;
      return {
        amount,
        amountWithTax: price,
        taxAmount,
        itemDetails,
      };
    } catch (error) {
      console.error("Error in calculateGST:", error.message);
      throw error;
    }
  }
  async getItemDetails(itemId: string) {
    try {
      // console.log("Fetching item details for ID:", typeof itemId, itemId);
      const data = await this.itemModel
        .findOne({ _id: new ObjectId(itemId) })
        //  .populate({
        //     path: "item_taxes.item_tax_specification",
        //     model: "taxSpecification",
        //     select: ["tax_specification_name"],
        //   })
        .populate({
          path: "item_taxes.item_tax_id",
          model: "tax",
          select: ["tax_name", "tax_rate"],
        })
        .lean();
      // console.log("data is", data);

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
  async updateSalesDocument(body) {
    try {
      let data = await this.salesDocumentModel.findOneAndUpdate(
        { _id: body.id},
        { $set: { document_status: body.document_status } }, {
          new: true
      }
      );

      return data;
    } catch (error) {
      // console.error("Error updating sales document:", error);
      throw error;
    }
  }
}

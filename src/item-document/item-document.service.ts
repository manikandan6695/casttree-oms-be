import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IItemDocumentModel } from "./item-document.schema";

@Injectable()
export class ItemDocumentService {
  constructor(
    @InjectModel("itemDocument")
    private item_document_model: Model<IItemDocumentModel>
  ) {}
  async createItemDocuments(input: any[]) {
    try {
      // console.log("input is", input);

      let data = await this.item_document_model.insertMany(input);
      return data;
    } catch (err) {
      throw err;
    }
  }
  async getItemDocument(sourceId) {
    try {
      let data = await this.item_document_model.findOne({
        source_id: sourceId,
      });
      return { data };
    } catch (err) {
      throw err;
    }
  }

  async updateItemDocument(id, body) {
    try {
      let data = await this.item_document_model.updateOne(
        { _id: id },
        { $set: body }
      );
      return { message: "Updated successfully" };
    } catch (err) {
      throw err;
    }
  }
}

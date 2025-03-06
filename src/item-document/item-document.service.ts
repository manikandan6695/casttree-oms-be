import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DataSource } from "typeorm";
import { IItemDocumentModel } from "./item-document.schema";
import { SqlItemDocument } from "./sqlTables/item-document";

@Injectable()
export class ItemDocumentService {
  constructor(
    @InjectModel("itemDocument")
    private item_document_model: Model<IItemDocumentModel>,
    private dataSource: DataSource
  ) {}

  async onModuleInit() {
    this.watchChanges();
  }

  async watchChanges() {

    const changeStreamSalesDocument = this.item_document_model.watch();
    changeStreamSalesDocument.on('change', async (change) => {

      if (change.operationType === 'insert') {
        const newData = change.fullDocument;
        newData.id = newData._id;
        newData.created_at =  newData.created_at.toISOString();
        newData.updated_at =  newData.updated_at.toISOString();
        console.log({newData},newData._id,change.operationType);
        await this.dataSource
          .getRepository(SqlItemDocument)
          .save(newData);
      }
     if (change.operationType === 'update') {
       const updatedData = await this.item_document_model.findOne({ _id: change.documentKey._id }).lean();
        await this.dataSource
          .createQueryBuilder()
          .update(SqlItemDocument)
          .set(updatedData)
          .where('id = :id', { id: (change.documentKey._id).toString() })
          .execute();
      }
    });
}
  async createItemDocuments(input: any[]) {
    try {
      console.log("input is", input);

      let data = await this.item_document_model.insertMany(input);
      return data;
    } catch (err) {
      throw err;
    }
  }
}

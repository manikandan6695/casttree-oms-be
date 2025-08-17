import { Controller, Get, Post, Query } from "@nestjs/common";
import { SalesDocumentSyncService } from "./sales-document-sync.service";

@Controller("sales-document-sync")
export class SalesDocumentSyncController {
  constructor(private readonly salesDocumentSyncService: SalesDocumentSyncService) {}

  @Get("status")
  async getSyncStatus() {
    return await this.salesDocumentSyncService.getSyncStatus();
  }

  @Post("sync-existing")
  async syncExistingSalesDocuments() {
    await this.salesDocumentSyncService.syncExistingSalesDocuments();
    return {
      message: "Sync of existing sales documents initiated",
      timestamp: new Date()
    };
  }

  @Get("synced-documents")
  async getSyncedSalesDocuments(
    @Query("skip") skip: number = 0,
    @Query("limit") limit: number = 10
  ) {
    return await this.salesDocumentSyncService.getSyncedSalesDocuments(skip, limit);
  }

  @Get("find-by-mongo-id")
  async findSyncedSalesDocumentByMongoId(@Query("mongoId") mongoId: string) {
    return await this.salesDocumentSyncService.findSyncedSalesDocumentByMongoId(mongoId);
  }

  @Get("find-by-document-number")
  async findSyncedSalesDocumentsByDocumentNumber(@Query("documentNumber") documentNumber: string) {
    return await this.salesDocumentSyncService.findSyncedSalesDocumentsByDocumentNumber(documentNumber);
  }
}

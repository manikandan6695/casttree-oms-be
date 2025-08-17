import { Controller, Get, Post, Query } from "@nestjs/common";
import { PaymentSyncService } from "./payment-sync.service";

@Controller("payment-sync")
export class PaymentSyncController {
  constructor(private readonly paymentSyncService: PaymentSyncService) {}

  @Get("status")
  async getSyncStatus() {
    return await this.paymentSyncService.getSyncStatus();
  }

  @Post("sync-existing")
  async syncExistingPayments() {
    await this.paymentSyncService.syncExistingPayments();
    return {
      message: "Sync of existing payments initiated",
      timestamp: new Date()
    };
  }

  @Get("synced-payments")
  async getSyncedPayments(
    @Query("skip") skip: number = 0,
    @Query("limit") limit: number = 10
  ) {
    return await this.paymentSyncService.getSyncedPayments(skip, limit);
  }

  @Get("find-by-mongo-id")
  async findSyncedPaymentByMongoId(@Query("mongoId") mongoId: string) {
    return await this.paymentSyncService.findSyncedPaymentByMongoId(mongoId);
  }

  @Get("find-by-order-id")
  async findSyncedPaymentsByOrderId(@Query("paymentOrderId") paymentOrderId: string) {
    return await this.paymentSyncService.findSyncedPaymentsByOrderId(paymentOrderId);
  }

  @Get("find-by-status")
  async findSyncedPaymentsByStatus(@Query("status") status: string) {
    return await this.paymentSyncService.findSyncedPaymentsByStatus(status);
  }

  @Get("statistics")
  async getPaymentStatistics() {
    return await this.paymentSyncService.getPaymentStatistics();
  }
}

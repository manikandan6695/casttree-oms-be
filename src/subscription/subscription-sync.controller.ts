import { Controller, Get, Post, Query } from "@nestjs/common";
import { SubscriptionSyncService } from "./subscription-sync.service";

@Controller("subscription-sync")
export class SubscriptionSyncController {
  constructor(private readonly subscriptionSyncService: SubscriptionSyncService) {}

  @Get("status")
  async getSyncStatus() {
    return await this.subscriptionSyncService.getSyncStatus();
  }

  @Post("sync-existing")
  async syncExistingSubscriptions() {
    await this.subscriptionSyncService.syncExistingSubscriptions();
    return {
      message: "Sync of existing subscriptions initiated",
      timestamp: new Date()
    };
  }

  @Get("synced-subscriptions")
  async getSyncedSubscriptions(
    @Query("skip") skip: number = 0,
    @Query("limit") limit: number = 10
  ) {
    return await this.subscriptionSyncService.getSyncedSubscriptions(skip, limit);
  }

  @Get("find-by-mongo-id")
  async findSyncedSubscriptionByMongoId(@Query("mongoId") mongoId: string) {
    return await this.subscriptionSyncService.findSyncedSubscriptionByMongoId(mongoId);
  }

  @Get("find-by-user-id")
  async findSyncedSubscriptionsByUserId(@Query("userId") userId: string) {
    return await this.subscriptionSyncService.findSyncedSubscriptionsByUserId(userId);
  }

  @Get("find-by-plan-id")
  async findSyncedSubscriptionsByPlanId(@Query("planId") planId: string) {
    return await this.subscriptionSyncService.findSyncedSubscriptionsByPlanId(planId);
  }

  @Get("find-by-status")
  async findSyncedSubscriptionsByStatus(@Query("status") status: string) {
    return await this.subscriptionSyncService.findSyncedSubscriptionsByStatus(status);
  }

  @Get("find-by-subscription-status")
  async findSyncedSubscriptionsBySubscriptionStatus(@Query("subscriptionStatus") subscriptionStatus: string) {
    return await this.subscriptionSyncService.findSyncedSubscriptionsBySubscriptionStatus(subscriptionStatus);
  }

  @Get("statistics")
  async getSubscriptionStatistics() {
    return await this.subscriptionSyncService.getSubscriptionStatistics();
  }
}

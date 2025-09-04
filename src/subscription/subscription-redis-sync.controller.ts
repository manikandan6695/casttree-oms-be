import { Controller, Get, Post, Delete, Query, Param, HttpException, HttpStatus } from "@nestjs/common";
import { SubscriptionRedisSyncService } from "./subscription-redis-sync.service";

@Controller("subscription-redis-sync")
export class SubscriptionRedisSyncController {
  constructor(
    private readonly subscriptionRedisSyncService: SubscriptionRedisSyncService
  ) {}

  @Get("status")
  async getSyncStatus() {
    try {
      return await this.subscriptionRedisSyncService.getSyncStatus();
    } catch (error) {
      throw new HttpException(
        `Error getting sync status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("pause")
  async pauseSync() {
    try {
      await this.subscriptionRedisSyncService.pauseSync();
      return { message: "Sync paused successfully" };
    } catch (error) {
      throw new HttpException(
        `Error pausing sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("resume")
  async resumeSync() {
    try {
      await this.subscriptionRedisSyncService.resumeSync();
      return { message: "Sync resumed successfully" };
    } catch (error) {
      throw new HttpException(
        `Error resuming sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("synced-subscriptions")
  async getSyncedSubscriptions(
    @Query("skip") skip: string = "0",
    @Query("limit") limit: string = "10"
  ) {
    try {
      const skipNum = parseInt(skip, 10);
      const limitNum = parseInt(limit, 10);
      
      if (isNaN(skipNum) || isNaN(limitNum) || skipNum < 0 || limitNum < 1 || limitNum > 100) {
        throw new HttpException(
          "Invalid skip or limit parameters",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.subscriptionRedisSyncService.getSyncedSubscriptions(skipNum, limitNum);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error getting synced subscriptions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("statistics")
  async getSubscriptionStatistics() {
    try {
      return await this.subscriptionRedisSyncService.getSubscriptionStatistics();
    } catch (error) {
      throw new HttpException(
        `Error getting subscription statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }



  @Get("find-by-mongo-id/:mongoId")
  async findSyncedSubscriptionByMongoId(@Param("mongoId") mongoId: string) {
    try {
      if (!mongoId || mongoId.length !== 24) {
        throw new HttpException(
          "Invalid MongoDB ObjectId format",
          HttpStatus.BAD_REQUEST
        );
      }

      const subscription = await this.subscriptionRedisSyncService.findSyncedSubscriptionByMongoId(mongoId);
      
      if (!subscription) {
        throw new HttpException(
          "Subscription not found",
          HttpStatus.NOT_FOUND
        );
      }

      return subscription;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding subscription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-user-id/:userId")
  async findSyncedSubscriptionsByUserId(@Param("userId") userId: string) {
    try {
      if (!userId || userId.length !== 24) {
        throw new HttpException(
          "Invalid MongoDB ObjectId format",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.subscriptionRedisSyncService.findSyncedSubscriptionsByUserId(userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding subscriptions by user ID: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-plan-id/:planId")
  async findSyncedSubscriptionsByPlanId(@Param("planId") planId: string) {
    try {
      if (!planId) {
        throw new HttpException(
          "Plan ID is required",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.subscriptionRedisSyncService.findSyncedSubscriptionsByPlanId(planId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding subscriptions by plan ID: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-status/:status")
  async findSyncedSubscriptionsByStatus(@Param("status") status: string) {
    try {
      if (!status) {
        throw new HttpException(
          "Status is required",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.subscriptionRedisSyncService.findSyncedSubscriptionsByStatus(status);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding subscriptions by status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-subscription-status/:subscriptionStatus")
  async findSyncedSubscriptionsBySubscriptionStatus(@Param("subscriptionStatus") subscriptionStatus: string) {
    try {
      if (!subscriptionStatus) {
        throw new HttpException(
          "Subscription status is required",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.subscriptionRedisSyncService.findSyncedSubscriptionsBySubscriptionStatus(subscriptionStatus);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding subscriptions by subscription status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("sync-existing")
  async syncExistingSubscriptions() {
    try {
      return await this.subscriptionRedisSyncService.syncExistingSubscriptions();
    } catch (error) {
      throw new HttpException(
        `Error syncing existing subscriptions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }



  @Delete("clear-queue")
  async clearQueue() {
    try {
      return await this.subscriptionRedisSyncService.clearQueue();
    } catch (error) {
      throw new HttpException(
        `Error clearing queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

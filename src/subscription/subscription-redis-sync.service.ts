import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ISubscriptionModel } from "./schema/subscription.schema";
import { RedisQueueService, QueueJob } from "../redis/redis-queue.service";
import { getRedisSyncConfig } from "./sql/redis-sync.config";
import { SQL_POOL } from "./sql/sql.provider";
import * as sql from 'mssql';

@Injectable()
export class SubscriptionRedisSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionRedisSyncService.name);
  private changeStream: any;
  private workerInterval: NodeJS.Timeout;
  private retryQueueInterval: NodeJS.Timeout;
  private config = getRedisSyncConfig();

  constructor(
    @InjectModel("subscription")
    private readonly subscriptionModel: Model<ISubscriptionModel>,
    @Inject(SQL_POOL)
    private readonly sqlPool: sql.ConnectionPool,
    private readonly redisQueue: RedisQueueService
  ) {}

  async onModuleInit() {
    await this.setupChangeStream();
    this.startWorker();
    this.startRetryQueueProcessor();
    this.logger.log("Redis-based subscription sync service initialized");
  }

  async onModuleDestroy() {
    if (this.changeStream) {
      this.changeStream.close();
    }
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
    }
    if (this.retryQueueInterval) {
      clearInterval(this.retryQueueInterval);
    }
  }

  private async setupChangeStream() {
    try {
      this.changeStream = this.subscriptionModel.watch([], {
        fullDocument: "updateLookup",
        resumeAfter: undefined,
      });

      this.changeStream.on("change", (change) => {
        this.queueChange(change);
      });

      this.changeStream.on("error", (error) => {
        this.logger.error("Change stream error:", error);
        // Implement retry logic with exponential backoff
        setTimeout(() => this.setupChangeStream(), 5000);
      });

      this.logger.log("Change stream initialized successfully");
    } catch (error) {
      this.logger.error("Failed to setup change stream:", error);
      setTimeout(() => this.setupChangeStream(), 10000);
    }
  }

  private async queueChange(change: any) {
    try {
      const { operationType, fullDocument, documentKey } = change;

      if (!fullDocument && !documentKey) {
        this.logger.warn("Change event missing document data:", change);
        return;
      }

      const job: Omit<QueueJob, 'id' | 'timestamp' | 'retryCount'> = {
        operationType,
        document: fullDocument || { _id: documentKey._id },
        priority: this.getPriority(operationType),
        maxRetries: this.getMaxRetries(operationType),
        status: 'pending',
      };

      await this.redisQueue.enqueueJob(job);
      this.logger.debug(`Queued ${operationType} job for subscription ${fullDocument?._id || documentKey._id}`);
    } catch (error) {
      this.logger.error("Error queuing change:", error);
    }
  }

  private getPriority(operationType: string): number {
    switch (operationType) {
      case "insert":
        return this.config.insertPriority;
      case "update":
        return this.config.updatePriority;
      case "delete":
        return this.config.deletePriority;
      default:
        return 1;
    }
  }

  private getMaxRetries(operationType: string): number {
    switch (operationType) {
      case "insert":
        return this.config.insertMaxRetries;
      case "update":
        return this.config.updateMaxRetries;
      case "delete":
        return this.config.deleteMaxRetries;
      default:
        return 3;
    }
  }

  private startWorker() {
    this.workerInterval = setInterval(async () => {
      await this.processJobs();
    }, this.config.workerInterval);
  }

  private startRetryQueueProcessor() {
    this.retryQueueInterval = setInterval(async () => {
      await this.redisQueue.processRetryQueue();
    }, this.config.retryQueueInterval);
  }

  private async processJobs() {
    try {
      // Process multiple jobs concurrently based on configuration
      const concurrentJobs: Promise<void>[] = [];

      for (let i = 0; i < this.config.maxConcurrentJobs; i++) {
        const job = await this.redisQueue.dequeueJob();
        if (!job) break;

        const jobPromise = this.processJob(job);
        concurrentJobs.push(jobPromise);
      }

      if (concurrentJobs.length > 0) {
        await Promise.allSettled(concurrentJobs);
      }
    } catch (error) {
      this.logger.error("Error in job processing:", error);
    }
  }

  private async processJob(job: QueueJob): Promise<void> {
    try {
      this.logger.debug(`Processing job ${job.id}: ${job.operationType}`);

      switch (job.operationType) {
        case "insert":
          await this.handleInsert(job.document);
          break;
        case "update":
          await this.handleUpdate(job.document);
          break;
        case "delete":
          await this.handleDelete(job.document._id);
          break;
      }

      await this.redisQueue.completeJob(job.id);
      this.logger.debug(`Job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      await this.redisQueue.failJob(job.id, error.message);
    }
  }

  private async handleInsert(subscription: ISubscriptionModel): Promise<void> {
    try {
      const subscriptionData = this.mapToSubscriptionEntity(subscription);
      await this.insertSubscriptionToSql(subscriptionData);
      this.logger.log(`Inserted new subscription ${subscription._id} to SQL database`);
    } catch (error) {
      this.logger.error(`Error inserting subscription ${subscription._id}:`, error);
      throw error;
    }
  }

  private async handleUpdate(subscription: ISubscriptionModel): Promise<void> {
    try {
      const subscriptionData = this.mapToSubscriptionEntity(subscription);
      
      // Check if subscription exists
      const existingSubscription = await this.findSubscriptionById(subscription._id.toString());
      
      if (existingSubscription) {
        await this.updateSubscriptionInSql(subscriptionData);
        this.logger.log(`Updated subscription ${subscription._id} in SQL database`);
      } else {
        // If subscription doesn't exist, insert it
        await this.insertSubscriptionToSql(subscriptionData);
        this.logger.log(`Inserted missing subscription ${subscription._id} to SQL database`);
      }
    } catch (error) {
      this.logger.error(`Error updating subscription ${subscription._id}:`, error);
      throw error;
    }
  }

  private async handleDelete(subscriptionId: string): Promise<void> {
    try {
      await this.deleteSubscriptionFromSql(subscriptionId);
      this.logger.log(`Deleted subscription ${subscriptionId} from SQL database`);
    } catch (error) {
      this.logger.error(`Error deleting subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  private mapToSubscriptionEntity(subscription: ISubscriptionModel): any {
    return {
      mongoId: subscription._id ? subscription._id.toString() : null,
      userId: subscription.userId ? subscription.userId.toString() : null,
      planId: subscription.planId,
      totalCount: subscription.totalCount,
      currentStart: subscription.currentStart,
      quantity: subscription.quantity,
      currentEnd: subscription.currentEnd,
      startAt: subscription.startAt,
      scheduleChangeAt: subscription.scheduleChangeAt,
      endAt: subscription.endAt,
      paidCount: subscription.paidCount,
      expireBy: subscription.expireBy,
      notes: subscription.notes,
      subscriptionStatus: subscription.subscriptionStatus,
      metaData: subscription.metaData,
      status: subscription.status,
      createdBy: subscription.createdBy ? subscription.createdBy.toString() : null,
      updatedBy: subscription.updatedBy ? subscription.updatedBy.toString() : null,
    };
  }

  private async insertSubscriptionToSql(subscriptionData: any): Promise<void> {
    const request = this.sqlPool.request();
    
    request.input('mongoId', sql.NVarChar(24), subscriptionData.mongoId);
    request.input('userId', sql.NVarChar(24), subscriptionData.userId);
    request.input('planId', sql.NVarChar(100), subscriptionData.planId);
    request.input('totalCount', sql.Int, subscriptionData.totalCount);
    request.input('currentStart', sql.DateTime, subscriptionData.currentStart);
    request.input('quantity', sql.Int, subscriptionData.quantity);
    request.input('currentEnd', sql.DateTime, subscriptionData.currentEnd);
    request.input('startAt', sql.DateTime, subscriptionData.startAt);
    request.input('scheduleChangeAt', sql.NVarChar(100), subscriptionData.scheduleChangeAt);
    request.input('endAt', sql.DateTime, subscriptionData.endAt);
    request.input('paidCount', sql.Int, subscriptionData.paidCount);
    request.input('expireBy', sql.DateTime, subscriptionData.expireBy);
    request.input('notes', sql.NVarChar(sql.MAX), JSON.stringify(subscriptionData.notes));
    request.input('subscriptionStatus', sql.NVarChar(50), subscriptionData.subscriptionStatus);
    request.input('metaData', sql.NVarChar(sql.MAX), JSON.stringify(subscriptionData.metaData));
    request.input('status', sql.NVarChar(50), subscriptionData.status);
    request.input('createdBy', sql.NVarChar(24), subscriptionData.createdBy);
    request.input('updatedBy', sql.NVarChar(24), subscriptionData.updatedBy);

    await request.query(`
      INSERT INTO subscription (
        mongoId, userId, planId, totalCount, currentStart, quantity, currentEnd,
        startAt, scheduleChangeAt, endAt, paidCount, expireBy, notes,
        subscriptionStatus, metaData, status, createdBy, updatedBy
      ) VALUES (
        @mongoId, @userId, @planId, @totalCount, @currentStart, @quantity, @currentEnd,
        @startAt, @scheduleChangeAt, @endAt, @paidCount, @expireBy, @notes,
        @subscriptionStatus, @metaData, @status, @createdBy, @updatedBy
      )
    `);
  }

  private async updateSubscriptionInSql(subscriptionData: any): Promise<void> {
    const request = this.sqlPool.request();
    
    request.input('mongoId', sql.NVarChar(24), subscriptionData.mongoId);
    request.input('userId', sql.NVarChar(24), subscriptionData.userId);
    request.input('planId', sql.NVarChar(100), subscriptionData.planId);
    request.input('totalCount', sql.Int, subscriptionData.totalCount);
    request.input('currentStart', sql.DateTime, subscriptionData.currentStart);
    request.input('quantity', sql.Int, subscriptionData.quantity);
    request.input('currentEnd', sql.DateTime, subscriptionData.currentEnd);
    request.input('startAt', sql.DateTime, subscriptionData.startAt);
    request.input('scheduleChangeAt', sql.NVarChar(100), subscriptionData.scheduleChangeAt);
    request.input('endAt', sql.DateTime, subscriptionData.endAt);
    request.input('paidCount', sql.Int, subscriptionData.paidCount);
    request.input('expireBy', sql.DateTime, subscriptionData.expireBy);
    request.input('notes', sql.NVarChar(sql.MAX), JSON.stringify(subscriptionData.notes));
    request.input('subscriptionStatus', sql.NVarChar(50), subscriptionData.subscriptionStatus);
    request.input('metaData', sql.NVarChar(sql.MAX), JSON.stringify(subscriptionData.metaData));
    request.input('status', sql.NVarChar(50), subscriptionData.status);
    request.input('updatedBy', sql.NVarChar(24), subscriptionData.updatedBy);

    await request.query(`
      UPDATE subscription SET
        userId = @userId,
        planId = @planId,
        totalCount = @totalCount,
        currentStart = @currentStart,
        quantity = @quantity,
        currentEnd = @currentEnd,
        startAt = @startAt,
        scheduleChangeAt = @scheduleChangeAt,
        endAt = @endAt,
        paidCount = @paidCount,
        expireBy = @expireBy,
        notes = @notes,
        subscriptionStatus = @subscriptionStatus,
        metaData = @metaData,
        status = @status,
        updatedBy = @updatedBy
      WHERE mongoId = @mongoId
    `);
  }

  private async deleteSubscriptionFromSql(subscriptionId: string): Promise<void> {
    const request = this.sqlPool.request();
    request.input('mongoId', sql.NVarChar(24), subscriptionId);
    
    await request.query('DELETE FROM subscription WHERE mongoId = @mongoId');
  }

  private async findSubscriptionById(subscriptionId: string): Promise<any> {
    const request = this.sqlPool.request();
    request.input('mongoId', sql.NVarChar(24), subscriptionId);
    
    const result = await request.query('SELECT * FROM subscription WHERE mongoId = @mongoId');
    return result.recordset[0] || null;
  }

  // Public methods for monitoring and control
  async getSyncStatus() {
    const queueStats = await this.redisQueue.getQueueStats();
    return {
      ...queueStats,
      changeStreamActive: !!this.changeStream,
      workerActive: !!this.workerInterval,
      retryProcessorActive: !!this.retryQueueInterval,
    };
  }

  async pauseSync() {
    if (this.changeStream) {
      this.changeStream.close();
      this.changeStream = null;
    }
    this.logger.log("Sync paused");
  }

  async resumeSync() {
    if (!this.changeStream) {
      await this.setupChangeStream();
    }
    this.logger.log("Sync resumed");
  }

  async clearQueue() {
    await this.redisQueue.clearAllQueues();
    this.logger.log("Queue cleared");
  }

  // Method to manually trigger sync for existing subscriptions
  async syncExistingSubscriptions() {
    try {
      this.logger.log("Starting sync of existing subscriptions...");
      
      const subscriptions = await this.subscriptionModel.find({}).limit(100); // Limit to avoid memory issues
      
      for (const subscription of subscriptions) {
        const job: Omit<QueueJob, 'id' | 'timestamp' | 'retryCount'> = {
          operationType: 'update',
          document: subscription,
          priority: this.config.updatePriority,
          maxRetries: this.config.updateMaxRetries,
          status: 'pending',
        };

        await this.redisQueue.enqueueJob(job);
      }
      
      this.logger.log(`Successfully queued ${subscriptions.length} existing subscriptions for sync`);
      return { success: true, queuedCount: subscriptions.length };
    } catch (error) {
      this.logger.error("Error syncing existing subscriptions:", error);
      throw error;
    }
  }

  // Method to get synced subscriptions from SQL database
  async getSyncedSubscriptions(skip: number = 0, limit: number = 10) {
    try {
      const request = this.sqlPool.request();
      request.input('skip', sql.Int, skip);
      request.input('limit', sql.Int, limit);
      
      const result = await request.query(`
        SELECT * FROM subscription 
        ORDER BY created_at DESC 
        OFFSET @skip ROWS 
        FETCH NEXT @limit ROWS ONLY
      `);
      
      const countResult = await this.sqlPool.request().query('SELECT COUNT(*) as total FROM subscription');
      const total = countResult.recordset[0].total;
      
      return {
        subscriptions: result.recordset,
        total,
        skip,
        limit
      };
    } catch (error) {
      this.logger.error("Error getting synced subscriptions:", error);
      throw error;
    }
  }

  // Method to find subscription by mongoId in SQL database
  async findSyncedSubscriptionByMongoId(mongoId: string) {
    try {
      return await this.findSubscriptionById(mongoId);
    } catch (error) {
      this.logger.error(`Error finding synced subscription by mongoId ${mongoId}:`, error);
      throw error;
    }
  }

  // Method to find subscriptions by userId
  async findSyncedSubscriptionsByUserId(userId: string) {
    try {
      const request = this.sqlPool.request();
      request.input('userId', sql.NVarChar(24), userId);
      
      const result = await request.query('SELECT * FROM subscription WHERE userId = @userId');
      return result.recordset;
    } catch (error) {
      this.logger.error(`Error finding synced subscriptions by userId ${userId}:`, error);
      throw error;
    }
  }

  // Method to find subscriptions by planId
  async findSyncedSubscriptionsByPlanId(planId: string) {
    try {
      const request = this.sqlPool.request();
      request.input('planId', sql.NVarChar(100), planId);
      
      const result = await request.query('SELECT * FROM subscription WHERE planId = @planId');
      return result.recordset;
    } catch (error) {
      this.logger.error(`Error finding synced subscriptions by planId ${planId}:`, error);
      throw error;
    }
  }

  // Method to find subscriptions by status
  async findSyncedSubscriptionsByStatus(status: string) {
    try {
      const request = this.sqlPool.request();
      request.input('status', sql.NVarChar(50), status);
      
      const result = await request.query('SELECT * FROM subscription WHERE status = @status');
      return result.recordset;
    } catch (error) {
      this.logger.error(`Error finding synced subscriptions by status ${status}:`, error);
      throw error;
    }
  }

  // Method to find subscriptions by subscription status
  async findSyncedSubscriptionsBySubscriptionStatus(subscriptionStatus: string) {
    try {
      const request = this.sqlPool.request();
      request.input('subscriptionStatus', sql.NVarChar(50), subscriptionStatus);
      
      const result = await request.query('SELECT * FROM subscription WHERE subscriptionStatus = @subscriptionStatus');
      return result.recordset;
    } catch (error) {
      this.logger.error(`Error finding synced subscriptions by subscription status ${subscriptionStatus}:`, error);
      throw error;
    }
  }

  // Method to get subscription statistics
  async getSubscriptionStatistics() {
    try {
      const request = this.sqlPool.request();
      
      const [totalResult, activeResult, expiredResult, cancelledResult] = await Promise.all([
        request.query('SELECT COUNT(*) as total FROM subscription'),
        request.query('SELECT COUNT(*) as active FROM subscription WHERE status = \'Active\''),
        request.query('SELECT COUNT(*) as expired FROM subscription WHERE status = \'Expired\''),
        request.query('SELECT COUNT(*) as cancelled FROM subscription WHERE status = \'Cancelled\'')
      ]);

      return {
        totalSubscriptions: totalResult.recordset[0].total,
        activeSubscriptions: activeResult.recordset[0].active,
        expiredSubscriptions: expiredResult.recordset[0].expired,
        cancelledSubscriptions: cancelledResult.recordset[0].cancelled,
        lastUpdated: new Date()
      };
    } catch (error) {
      this.logger.error("Error getting subscription statistics:", error);
      throw error;
    }
  }
}
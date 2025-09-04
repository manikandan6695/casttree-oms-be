import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { processInstanceModel } from "./schema/processInstance.schema";
import { ProcessInstanceSyncEntity } from "./process-instance-sync.entity";
import { RedisQueueService, QueueJob } from "../redis/redis-queue.service";
import { getProcessInstanceRedisSyncConfig } from "./redis-sync.config";

@Injectable()
export class ProcessInstanceSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessInstanceSyncService.name);
  private changeStream: any;
  private workerInterval: NodeJS.Timeout;
  private retryQueueInterval: NodeJS.Timeout;
  private config = getProcessInstanceRedisSyncConfig();

  constructor(
    @InjectModel("processInstance")
    private readonly processInstanceModel: Model<processInstanceModel>,
    @InjectRepository(ProcessInstanceSyncEntity)
    private readonly processInstanceRepository: Repository<ProcessInstanceSyncEntity>,
    private readonly redisQueue: RedisQueueService
  ) {}

  async onModuleInit() {
    await this.setupChangeStream();
    this.startWorker();
    this.startRetryQueueProcessor();
    this.logger.log("Redis-based process instance sync service initialized");
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
      this.changeStream = this.processInstanceModel.watch([], {
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
      this.logger.debug(`Queued ${operationType} job for process instance ${fullDocument?._id || documentKey._id}`);
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

  private async handleInsert(processInstance: processInstanceModel): Promise<void> {
    try {
      const processInstanceEntity = this.mapToProcessInstanceEntity(processInstance);
      await this.processInstanceRepository.save(processInstanceEntity);
      this.logger.log(`Inserted new process instance ${processInstance._id} to SQL database`);
    } catch (error) {
      this.logger.error(`Error inserting process instance ${processInstance._id}:`, error);
      throw error;
    }
  }

  private async handleUpdate(processInstance: processInstanceModel): Promise<void> {
    try {
      const processInstanceEntity = this.mapToProcessInstanceEntity(processInstance);
      
      // Check if process instance exists
      const existingProcessInstance = await this.processInstanceRepository.findOne({
        where: { mongoId: processInstance._id.toString() }
      });
      
      if (existingProcessInstance) {
        await this.processInstanceRepository.update(
          { mongoId: processInstance._id.toString() },
          processInstanceEntity
        );
        this.logger.log(`Updated process instance ${processInstance._id} in SQL database`);
      } else {
        // If process instance doesn't exist, insert it
        await this.processInstanceRepository.save(processInstanceEntity);
        this.logger.log(`Inserted missing process instance ${processInstance._id} to SQL database`);
      }
    } catch (error) {
      this.logger.error(`Error updating process instance ${processInstance._id}:`, error);
      throw error;
    }
  }

  private async handleDelete(processInstanceId: string): Promise<void> {
    try {
      await this.processInstanceRepository.delete({ mongoId: processInstanceId });
      this.logger.log(`Deleted process instance ${processInstanceId} from SQL database`);
    } catch (error) {
      this.logger.error(`Error deleting process instance ${processInstanceId}:`, error);
      throw error;
    }
  }

  private mapToProcessInstanceEntity(processInstance: processInstanceModel): ProcessInstanceSyncEntity {
    const entity = new ProcessInstanceSyncEntity();
    entity.mongoId = processInstance._id ? processInstance._id.toString() : null;
    entity.userId = processInstance.userId ? processInstance.userId.toString() : null;
    entity.processId = processInstance.processId ? processInstance.processId.toString() : null;
    entity.processType = processInstance.processType;
    entity.startedAt = processInstance.startedAt;
    entity.orderId = processInstance.orderId;
    entity.processStatus = processInstance.processStatus;
    entity.progressPercentage = Number(processInstance.progressPercentage);
    entity.currentTask = processInstance.currentTask ? processInstance.currentTask.toString() : null;
    entity.purchasedAt = processInstance.purchasedAt;
    entity.validTill = processInstance.validTill;
    entity.status = processInstance.status;
    entity.createdBy = processInstance.createdBy ? processInstance.createdBy.toString() : null;
    entity.updatedBy = processInstance.updatedBy ? processInstance.updatedBy.toString() : null;
    return entity;
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

  // Method to manually trigger sync for existing process instances
  async syncExistingProcessInstances() {
    try {
      this.logger.log("Starting sync of existing process instances...");
      
      const processInstances = await this.processInstanceModel.find({}).limit(100); // Limit to avoid memory issues
      
      for (const processInstance of processInstances) {
        const job: Omit<QueueJob, 'id' | 'timestamp' | 'retryCount'> = {
          operationType: 'update',
          document: processInstance,
          priority: this.config.updatePriority,
          maxRetries: this.config.updateMaxRetries,
          status: 'pending',
        };

        await this.redisQueue.enqueueJob(job);
      }
      
      this.logger.log(`Successfully queued ${processInstances.length} existing process instances for sync`);
      return { success: true, queuedCount: processInstances.length };
    } catch (error) {
      this.logger.error("Error syncing existing process instances:", error);
      throw error;
    }
  }

  // Method to get synced process instances from SQL database
  async getSyncedProcessInstances(skip: number = 0, limit: number = 10) {
    try {
      const processInstances = await this.processInstanceRepository.find({
        skip,
        take: limit,
        order: {
          created_at: 'DESC'
        }
      });
      
      return {
        processInstances,
        total: await this.processInstanceRepository.count(),
        skip,
        limit
      };
    } catch (error) {
      this.logger.error("Error getting synced process instances:", error);
      throw error;
    }
  }

  // Method to find process instance by mongoId in SQL database
  async findSyncedProcessInstanceByMongoId(mongoId: string) {
    try {
      return await this.processInstanceRepository.findOne({
        where: { mongoId }
      });
    } catch (error) {
      this.logger.error(`Error finding synced process instance by mongoId ${mongoId}:`, error);
      throw error;
    }
  }

  // Method to find process instances by userId
  async findSyncedProcessInstancesByUserId(userId: string) {
    try {
      return await this.processInstanceRepository.find({
        where: { userId }
      });
    } catch (error) {
      this.logger.error(`Error finding synced process instances by userId ${userId}:`, error);
      throw error;
    }
  }

  // Method to find process instances by processId
  async findSyncedProcessInstancesByProcessId(processId: string) {
    try {
      return await this.processInstanceRepository.find({
        where: { processId }
      });
    } catch (error) {
      this.logger.error(`Error finding synced process instances by processId ${processId}:`, error);
      throw error;
    }
  }

  // Method to find process instances by status
  async findSyncedProcessInstancesByStatus(status: string) {
    try {
      return await this.processInstanceRepository.find({
        where: { status }
      });
    } catch (error) {
      this.logger.error(`Error finding synced process instances by status ${status}:`, error);
      throw error;
    }
  }

  // Method to find process instances by process status
  async findSyncedProcessInstancesByProcessStatus(processStatus: string) {
    try {
      return await this.processInstanceRepository.find({
        where: { processStatus }
      });
    } catch (error) {
      this.logger.error(`Error finding synced process instances by process status ${processStatus}:`, error);
      throw error;
    }
  }

  // Method to find process instances by order ID
  async findSyncedProcessInstancesByOrderId(orderId: string) {
    try {
      return await this.processInstanceRepository.find({
        where: { orderId }
      });
    } catch (error) {
      this.logger.error(`Error finding synced process instances by order ID ${orderId}:`, error);
      throw error;
    }
  }

  // Method to get process instance statistics
  async getProcessInstanceStatistics() {
    try {
      const [total, active, completed, failed] = await Promise.all([
        this.processInstanceRepository.count(),
        this.processInstanceRepository.count({ where: { status: 'Active' } }),
        this.processInstanceRepository.count({ where: { processStatus: 'Completed' } }),
        this.processInstanceRepository.count({ where: { processStatus: 'Failed' } })
      ]);

      return {
        totalProcessInstances: total,
        activeProcessInstances: active,
        completedProcessInstances: completed,
        failedProcessInstances: failed,
        lastUpdated: new Date()
      };
    } catch (error) {
      this.logger.error("Error getting process instance statistics:", error);
      throw error;
    }
  }
}
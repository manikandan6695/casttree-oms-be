import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

export interface QueueJob {
  id: string;
  operationType: 'insert' | 'update' | 'delete';
  document: any;
  priority: number;
  maxRetries: number;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface QueueStats {
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  retryQueueSize: number;
}

@Injectable()
export class RedisQueueService {
  private readonly logger = new Logger(RedisQueueService.name);
  private client: RedisClientType;
  private isConnected = false;
  private readonly QUEUE_PREFIX = 'subscription_sync';
  private readonly PENDING_QUEUE = `${this.QUEUE_PREFIX}:pending`;
  private readonly PROCESSING_QUEUE = `${this.QUEUE_PREFIX}:processing`;
  private readonly COMPLETED_QUEUE = `${this.QUEUE_PREFIX}:completed`;
  private readonly FAILED_QUEUE = `${this.QUEUE_PREFIX}:failed`;
  private readonly RETRY_QUEUE = `${this.QUEUE_PREFIX}:retry`;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT) || 5000,
        }
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Queue Client Error:', err.message || err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis Queue Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Redis Queue Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis Queue Service:', error);
      this.isConnected = false;
    }
  }

  async enqueueJob(jobData: Omit<QueueJob, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const job: QueueJob = {
        ...jobData,
        id: this.generateJobId(),
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending'
      };

      // Add to pending queue with priority score
      await this.client.zAdd(this.PENDING_QUEUE, {
        score: job.priority,
        value: JSON.stringify(job)
      });

      this.logger.debug(`Job ${job.id} enqueued with priority ${job.priority}`);
      return job.id;
    } catch (error) {
      this.logger.error('Error enqueuing job:', error);
      throw error;
    }
  }

  async dequeueJob(): Promise<QueueJob | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      // Get highest priority job (lowest score = highest priority)
      const result = await this.client.zPopMin(this.PENDING_QUEUE);
      
      if (!result) {
        return null;
      }

      const job: QueueJob = JSON.parse(result.value);
      job.status = 'processing';

      // Move to processing queue
      await this.client.zAdd(this.PROCESSING_QUEUE, {
        score: Date.now(),
        value: JSON.stringify(job)
      });

      this.logger.debug(`Job ${job.id} dequeued and moved to processing`);
      return job;
    } catch (error) {
      this.logger.error('Error dequeuing job:', error);
      return null;
    }
  }

  async completeJob(jobId: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      // Find and remove from processing queue
      const processingJobs = await this.client.zRange(this.PROCESSING_QUEUE, 0, -1);
      let jobToComplete: QueueJob | null = null;

      for (const jobStr of processingJobs) {
        const job: QueueJob = JSON.parse(jobStr);
        if (job.id === jobId) {
          jobToComplete = job;
          await this.client.zRem(this.PROCESSING_QUEUE, jobStr);
          break;
        }
      }

      if (jobToComplete) {
        jobToComplete.status = 'completed';
        await this.client.zAdd(this.COMPLETED_QUEUE, {
          score: Date.now(),
          value: JSON.stringify(jobToComplete)
        });

        this.logger.debug(`Job ${jobId} completed successfully`);
      }
    } catch (error) {
      this.logger.error(`Error completing job ${jobId}:`, error);
    }
  }

  async failJob(jobId: string, errorMessage: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      // Find and remove from processing queue
      const processingJobs = await this.client.zRange(this.PROCESSING_QUEUE, 0, -1);
      let jobToFail: QueueJob | null = null;

      for (const jobStr of processingJobs) {
        const job: QueueJob = JSON.parse(jobStr);
        if (job.id === jobId) {
          jobToFail = job;
          await this.client.zRem(this.PROCESSING_QUEUE, jobStr);
          break;
        }
      }

      if (jobToFail) {
        jobToFail.retryCount++;
        jobToFail.error = errorMessage;

        if (jobToFail.retryCount < jobToFail.maxRetries) {
          // Move to retry queue
          jobToFail.status = 'pending';
          await this.client.zAdd(this.RETRY_QUEUE, {
            score: Date.now() + (jobToFail.retryCount * 60000), // Exponential backoff
            value: JSON.stringify(jobToFail)
          });
          this.logger.warn(`Job ${jobId} failed, moved to retry queue (attempt ${jobToFail.retryCount}/${jobToFail.maxRetries})`);
        } else {
          // Move to failed queue
          jobToFail.status = 'failed';
          await this.client.zAdd(this.FAILED_QUEUE, {
            score: Date.now(),
            value: JSON.stringify(jobToFail)
          });
          this.logger.error(`Job ${jobId} failed permanently after ${jobToFail.maxRetries} retries`);
        }
      }
    } catch (error) {
      this.logger.error(`Error failing job ${jobId}:`, error);
    }
  }

  async processRetryQueue(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const now = Date.now();
      const retryJobs = await this.client.zRangeByScore(this.RETRY_QUEUE, 0, now);

      for (const jobStr of retryJobs) {
        const job: QueueJob = JSON.parse(jobStr);
        
        // Remove from retry queue
        await this.client.zRem(this.RETRY_QUEUE, jobStr);
        
        // Add back to pending queue
        await this.client.zAdd(this.PENDING_QUEUE, {
          score: job.priority,
          value: JSON.stringify(job)
        });

        this.logger.debug(`Job ${job.id} moved from retry to pending queue`);
      }
    } catch (error) {
      this.logger.error('Error processing retry queue:', error);
    }
  }

  async getQueueStats(): Promise<QueueStats> {
    if (!this.isConnected) {
      return {
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        retryQueueSize: 0
      };
    }

    try {
      const [pendingJobs, processingJobs, completedJobs, failedJobs, retryQueueSize] = await Promise.all([
        this.client.zCard(this.PENDING_QUEUE),
        this.client.zCard(this.PROCESSING_QUEUE),
        this.client.zCard(this.COMPLETED_QUEUE),
        this.client.zCard(this.FAILED_QUEUE),
        this.client.zCard(this.RETRY_QUEUE)
      ]);

      return {
        pendingJobs,
        processingJobs,
        completedJobs,
        failedJobs,
        retryQueueSize
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      return {
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        retryQueueSize: 0
      };
    }
  }

  async clearAllQueues(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await Promise.all([
        this.client.del(this.PENDING_QUEUE),
        this.client.del(this.PROCESSING_QUEUE),
        this.client.del(this.COMPLETED_QUEUE),
        this.client.del(this.FAILED_QUEUE),
        this.client.del(this.RETRY_QUEUE)
      ]);

      this.logger.log('All queues cleared successfully');
    } catch (error) {
      this.logger.error('Error clearing queues:', error);
      throw error;
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

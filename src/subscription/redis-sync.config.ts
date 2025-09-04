export interface RedisSyncConfig {
  // Queue settings
  batchSize: number;
  workerInterval: number;
  retryQueueInterval: number;
  maxConcurrentJobs: number;
  
  // Cache settings
  phoneCacheTTL: number;
  maxCacheSize: number;
  
  // Priority settings
  insertPriority: number;
  updatePriority: number;
  deletePriority: number;
  
  // Retry settings
  insertMaxRetries: number;
  updateMaxRetries: number;
  deleteMaxRetries: number;
  
  // Redis connection settings
  redisUrl: string;
  connectionTimeout: number;
}

export const getRedisSyncConfig = (): RedisSyncConfig => ({
  // Queue settings
  batchSize: parseInt(process.env.SUBSCRIPTION_SYNC_BATCH_SIZE || '100'),
  workerInterval: parseInt(process.env.SUBSCRIPTION_SYNC_WORKER_INTERVAL || '100'),
  retryQueueInterval: parseInt(process.env.SUBSCRIPTION_SYNC_RETRY_INTERVAL || '10000'),
  maxConcurrentJobs: parseInt(process.env.SUBSCRIPTION_SYNC_MAX_CONCURRENT || '5'),
  
  // Cache settings
  phoneCacheTTL: parseInt(process.env.SUBSCRIPTION_SYNC_CACHE_TTL || '3600000'), // 1 hour
  maxCacheSize: parseInt(process.env.SUBSCRIPTION_SYNC_MAX_CACHE_SIZE || '1000'),
  
  // Priority settings (higher number = higher priority)
  insertPriority: parseInt(process.env.SUBSCRIPTION_SYNC_INSERT_PRIORITY || '1'),
  updatePriority: parseInt(process.env.SUBSCRIPTION_SYNC_UPDATE_PRIORITY || '3'),
  deletePriority: parseInt(process.env.SUBSCRIPTION_SYNC_DELETE_PRIORITY || '5'),
  
  // Retry settings
  insertMaxRetries: parseInt(process.env.SUBSCRIPTION_SYNC_INSERT_RETRIES || '3'),
  updateMaxRetries: parseInt(process.env.SUBSCRIPTION_SYNC_UPDATE_RETRIES || '3'),
  deleteMaxRetries: parseInt(process.env.SUBSCRIPTION_SYNC_DELETE_RETRIES || '5'),
  
  // Redis connection settings
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
});

// Environment variable documentation
export const SUBSCRIPTION_SYNC_ENV_VARS = {
  SUBSCRIPTION_SYNC_BATCH_SIZE: 'Number of jobs to process in each batch (default: 100)',
  SUBSCRIPTION_SYNC_WORKER_INTERVAL: 'Worker polling interval in milliseconds (default: 100)',
  SUBSCRIPTION_SYNC_RETRY_INTERVAL: 'Retry queue processing interval in milliseconds (default: 10000)',
  SUBSCRIPTION_SYNC_MAX_CONCURRENT: 'Maximum concurrent jobs to process (default: 5)',
  SUBSCRIPTION_SYNC_CACHE_TTL: 'Phone number cache TTL in milliseconds (default: 3600000)',
  SUBSCRIPTION_SYNC_MAX_CACHE_SIZE: 'Maximum phone number cache size (default: 1000)',
  SUBSCRIPTION_SYNC_INSERT_PRIORITY: 'Priority for insert operations (default: 1)',
  SUBSCRIPTION_SYNC_UPDATE_PRIORITY: 'Priority for update operations (default: 3)',
  SUBSCRIPTION_SYNC_DELETE_PRIORITY: 'Priority for delete operations (default: 5)',
  SUBSCRIPTION_SYNC_INSERT_RETRIES: 'Maximum retries for insert operations (default: 3)',
  SUBSCRIPTION_SYNC_UPDATE_RETRIES: 'Maximum retries for update operations (default: 3)',
  SUBSCRIPTION_SYNC_DELETE_RETRIES: 'Maximum retries for delete operations (default: 5)',
  REDIS_URL: 'Redis connection URL (default: redis://localhost:6379)',
  REDIS_CONNECTION_TIMEOUT: 'Redis connection timeout in milliseconds (default: 5000)',
};

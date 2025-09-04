# Process Instance Redis Sync Service

This service provides Redis-based synchronization of process instance data from MongoDB to SQL database using MongoDB change streams and Redis queues, following the same pattern as the UserSyncRedisService.

## Features

- **Real-time Sync**: Uses MongoDB change streams to detect process instance changes
- **Redis Queue System**: Advanced queue with priority, retry, and concurrent processing
- **TypeORM Integration**: Uses TypeORM for SQL database operations
- **Configuration-based**: Configurable priorities, retries, and processing intervals
- **Concurrent Processing**: Processes multiple jobs simultaneously
- **Comprehensive Error Handling**: Retry logic with exponential backoff
- **Monitoring & Control**: Full monitoring and control APIs
- **Statistics & Analytics**: Detailed process instance statistics

## Architecture

```
MongoDB Change Stream → Redis Queue (Priority-based) → SQL Database (TypeORM)
                    ↓
              Job Processing (Concurrent)
                    ↓
              Retry Queue (Failed Jobs)
```

## Usage

### 1. Import the Module

```typescript
import { ProcessModule } from './process/process.module';

@Module({
  imports: [
    ProcessModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 2. Service Initialization

The service automatically initializes when the module is loaded:

- Sets up MongoDB change stream listener
- Initializes Redis queue service
- Starts worker for job processing
- Starts retry queue processor
- Begins processing process instance sync jobs

### 3. API Endpoints

#### Get Sync Status
```http
GET /process-instance-sync/status
```

Returns current sync status including:
- Queue statistics (pending, processing, completed, failed, retry)
- Change stream status
- Worker status
- Retry processor status

#### Pause Sync
```http
POST /process-instance-sync/pause
```

Pauses the process instance sync service.

#### Resume Sync
```http
POST /process-instance-sync/resume
```

Resumes the process instance sync service.

#### Get Synced Process Instances
```http
GET /process-instance-sync/synced-process-instances?skip=0&limit=10
```

Retrieves paginated list of synced process instances from SQL database.

#### Find Process Instance by MongoDB ID
```http
GET /process-instance-sync/find-by-mongo-id/{mongoId}
```

Finds a synced process instance by its MongoDB ObjectId.

#### Find Process Instances by User ID
```http
GET /process-instance-sync/find-by-user-id/{userId}
```

Finds all synced process instances for a specific user.

#### Find Process Instances by Process ID
```http
GET /process-instance-sync/find-by-process-id/{processId}
```

Finds all synced process instances for a specific process.

#### Find Process Instances by Status
```http
GET /process-instance-sync/find-by-status/{status}
```

Finds all synced process instances with a specific status.

#### Find Process Instances by Process Status
```http
GET /process-instance-sync/find-by-process-status/{processStatus}
```

Finds all synced process instances with a specific process status.

#### Find Process Instances by Order ID
```http
GET /process-instance-sync/find-by-order-id/{orderId}
```

Finds all synced process instances for a specific order.

#### Get Process Instance Statistics
```http
GET /process-instance-sync/statistics
```

Returns process instance statistics including:
- Total process instances
- Active process instances
- Completed process instances
- Failed process instances
- Last updated timestamp

#### Sync Existing Process Instances
```http
POST /process-instance-sync/sync-existing
```

Manually triggers sync for existing process instances (useful for initial setup).

#### Clear Queue
```http
DELETE /process-instance-sync/clear-queue
```

Clears all pending sync jobs from the queue.

## Configuration

The service uses the following environment variables:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_CONNECTION_TIMEOUT=5000

# Process Instance Sync Configuration
PROCESS_INSTANCE_SYNC_WORKER_INTERVAL=1000          # Worker runs every 1 second
PROCESS_INSTANCE_SYNC_RETRY_INTERVAL=30000          # Retry processor runs every 30 seconds
PROCESS_INSTANCE_SYNC_MAX_CONCURRENT=5              # Process up to 5 jobs concurrently
PROCESS_INSTANCE_SYNC_INSERT_PRIORITY=1             # Insert priority (lower = higher priority)
PROCESS_INSTANCE_SYNC_UPDATE_PRIORITY=2             # Update priority
PROCESS_INSTANCE_SYNC_DELETE_PRIORITY=3             # Delete priority
PROCESS_INSTANCE_SYNC_INSERT_MAX_RETRIES=3          # Max retries for insert operations
PROCESS_INSTANCE_SYNC_UPDATE_MAX_RETRIES=3          # Max retries for update operations
PROCESS_INSTANCE_SYNC_DELETE_MAX_RETRIES=2          # Max retries for delete operations
PROCESS_INSTANCE_SYNC_JOB_TIMEOUT=30000             # Job timeout in milliseconds
PROCESS_INSTANCE_SYNC_CHANGE_STREAM_RETRY=5000      # Change stream retry delay
```

## Data Flow

1. **Change Detection**: MongoDB change stream detects process instance changes
2. **Job Creation**: Creates sync job with priority and retry configuration
3. **Queue Processing**: Redis queue processes jobs with priority-based ordering
4. **Concurrent Processing**: Multiple jobs processed simultaneously
5. **SQL Sync**: TypeORM operations update database
6. **Retry Logic**: Failed jobs moved to retry queue with exponential backoff
7. **Status Tracking**: Job status tracked through completion/failure

## Queue System

### Job Priorities
- **Insert**: Priority 1 (highest)
- **Update**: Priority 2 (medium)
- **Delete**: Priority 3 (lowest)

### Retry Configuration
- **Insert/Update**: 3 retries
- **Delete**: 2 retries
- **Exponential Backoff**: 1min, 2min, 4min, etc.

### Concurrent Processing
- Configurable concurrent job processing
- Default: 5 concurrent jobs
- Prevents overwhelming the SQL database

## Error Handling

- **Retry Logic**: Failed jobs are retried with exponential backoff
- **Dead Letter Queue**: Permanently failed jobs are moved to failed queue
- **Connection Recovery**: Automatic Redis reconnection on connection loss
- **Change Stream Recovery**: Automatic change stream restart on errors
- **TypeORM Error Handling**: Comprehensive TypeORM operation error handling

## Monitoring

The service provides comprehensive logging with prefixes:
- `[ProcessInstanceSyncService]` - General service logs
- `[ProcessInstanceSyncService] Job {id} completed` - Job completion logs
- `[ProcessInstanceSyncService] Error` - Error logs

## Data Mapping

The service maps MongoDB process instance documents to SQL entities:

### MongoDB Fields → SQL Columns
- `_id` → `mongoId`
- `userId` → `userId`
- `processId` → `processId`
- `processType` → `processType`
- `startedAt` → `startedAt`
- `orderId` → `orderId`
- `processStatus` → `processStatus`
- `progressPercentage` → `progressPercentage`
- `currentTask` → `currentTask`
- `purchasedAt` → `purchasedAt`
- `validTill` → `validTill`
- `status` → `status`
- `createdBy` → `createdBy`
- `updatedBy` → `updatedBy`

## Implementation Completed

The process instance sync service has been successfully implemented following the UserSyncRedisService pattern:

1. ✅ **Service Created**: `process-instance-sync.service.ts` with Redis queue integration
2. ✅ **Controller Created**: `process-instance-sync.controller.ts` with full API endpoints
3. ✅ **Module Updated**: `process.module.ts` includes TypeORM and RedisQueueService
4. ✅ **Configuration**: Environment-based configuration system
5. ✅ **TypeORM Integration**: Uses TypeORM for SQL database operations
6. ✅ **Pattern Consistency**: Follows the exact same pattern as UserSyncRedisService

The service now provides the same functionality with improved architecture, reliability, and performance.

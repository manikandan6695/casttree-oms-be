# Subscription Redis Sync Service

This service provides Redis-based synchronization of subscription data from MongoDB to SQL database using MongoDB change streams and Redis queues, following the same pattern as the UserSyncRedisService.

## Features

- **Real-time Sync**: Uses MongoDB change streams to detect subscription changes
- **Redis Queue System**: Advanced queue with priority, retry, and concurrent processing
- **Direct SQL Operations**: Uses mssql package for direct SQL database operations
- **Configuration-based**: Configurable priorities, retries, and processing intervals
- **Concurrent Processing**: Processes multiple jobs simultaneously
- **Comprehensive Error Handling**: Retry logic with exponential backoff
- **Monitoring & Control**: Full monitoring and control APIs
- **Statistics & Analytics**: Detailed subscription statistics

## Architecture

```
MongoDB Change Stream → Redis Queue (Priority-based) → SQL Database
                    ↓
              Job Processing (Concurrent)
                    ↓
              Retry Queue (Failed Jobs)
```

## Usage

### 1. Import the Module

```typescript
import { SubscriptionSyncModule } from './subscription/subscription-sync.module';

@Module({
  imports: [
    SubscriptionSyncModule,
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
- Begins processing subscription sync jobs

### 3. API Endpoints

#### Get Sync Status
```http
GET /subscription-redis-sync/status
```

Returns current sync status including:
- Queue statistics (pending, processing, completed, failed, retry)
- Change stream status
- Worker status
- Retry processor status

#### Pause Sync
```http
POST /subscription-redis-sync/pause
```

Pauses the subscription sync service.

#### Resume Sync
```http
POST /subscription-redis-sync/resume
```

Resumes the subscription sync service.

#### Get Synced Subscriptions
```http
GET /subscription-redis-sync/synced-subscriptions?skip=0&limit=10
```

Retrieves paginated list of synced subscriptions from SQL database.

#### Find Subscription by MongoDB ID
```http
GET /subscription-redis-sync/find-by-mongo-id/{mongoId}
```

Finds a synced subscription by its MongoDB ObjectId.

#### Find Subscriptions by User ID
```http
GET /subscription-redis-sync/find-by-user-id/{userId}
```

Finds all synced subscriptions for a specific user.

#### Find Subscriptions by Plan ID
```http
GET /subscription-redis-sync/find-by-plan-id/{planId}
```

Finds all synced subscriptions for a specific plan.

#### Find Subscriptions by Status
```http
GET /subscription-redis-sync/find-by-status/{status}
```

Finds all synced subscriptions with a specific status.

#### Find Subscriptions by Subscription Status
```http
GET /subscription-redis-sync/find-by-subscription-status/{subscriptionStatus}
```

Finds all synced subscriptions with a specific subscription status.

#### Get Subscription Statistics
```http
GET /subscription-redis-sync/statistics
```

Returns subscription statistics including:
- Total subscriptions
- Active subscriptions
- Expired subscriptions
- Cancelled subscriptions
- Last updated timestamp

#### Sync Existing Subscriptions
```http
POST /subscription-redis-sync/sync-existing
```

Manually triggers sync for existing subscriptions (useful for initial setup).

#### Clear Queue
```http
DELETE /subscription-redis-sync/clear-queue
```

Clears all pending sync jobs from the queue.

## Configuration

The service uses the following environment variables:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_CONNECTION_TIMEOUT=5000

# SQL Database Configuration
SQL_SERVER=localhost
SQL_DATABASE=casttree_oms
SQL_USER=sa
SQL_PASSWORD=your_password
SQL_PORT=1433
SQL_ENCRYPT=true
SQL_TRUST_CERT=true
SQL_POOL_MAX=10
SQL_POOL_MIN=0
SQL_POOL_IDLE_TIMEOUT=30000

# Subscription Sync Configuration
SUBSCRIPTION_SYNC_WORKER_INTERVAL=1000          # Worker runs every 1 second
SUBSCRIPTION_SYNC_RETRY_INTERVAL=30000          # Retry processor runs every 30 seconds
SUBSCRIPTION_SYNC_MAX_CONCURRENT=5              # Process up to 5 jobs concurrently
SUBSCRIPTION_SYNC_INSERT_PRIORITY=1             # Insert priority (lower = higher priority)
SUBSCRIPTION_SYNC_UPDATE_PRIORITY=2             # Update priority
SUBSCRIPTION_SYNC_DELETE_PRIORITY=3             # Delete priority
SUBSCRIPTION_SYNC_INSERT_MAX_RETRIES=3          # Max retries for insert operations
SUBSCRIPTION_SYNC_UPDATE_MAX_RETRIES=3          # Max retries for update operations
SUBSCRIPTION_SYNC_DELETE_MAX_RETRIES=2          # Max retries for delete operations
SUBSCRIPTION_SYNC_JOB_TIMEOUT=30000             # Job timeout in milliseconds
SUBSCRIPTION_SYNC_CHANGE_STREAM_RETRY=5000      # Change stream retry delay
```

## Data Flow

1. **Change Detection**: MongoDB change stream detects subscription changes
2. **Job Creation**: Creates sync job with priority and retry configuration
3. **Queue Processing**: Redis queue processes jobs with priority-based ordering
4. **Concurrent Processing**: Multiple jobs processed simultaneously
5. **SQL Sync**: Direct SQL operations update database
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
- **SQL Error Handling**: Comprehensive SQL operation error handling

## Monitoring

The service provides comprehensive logging with prefixes:
- `[SubscriptionRedisSyncService]` - General service logs
- `[SubscriptionRedisSyncService] Job {id} completed` - Job completion logs
- `[SubscriptionRedisSyncService] Error` - Error logs

## Migration Completed

The original `SubscriptionSyncService` has been removed and replaced with the Redis-based implementation:

1. ✅ **Service Removed**: `subscription-sync.service.ts` has been deleted
2. ✅ **Module Updated**: `subscription-sync.module.ts` now uses the Redis service
3. ✅ **API Maintained**: All public methods remain the same for backward compatibility
4. ✅ **Enhanced Features**: Redis queue provides better reliability and monitoring
5. ✅ **Pattern Consistency**: Now follows the same pattern as UserSyncRedisService

The service now provides the same functionality with improved architecture, reliability, and performance.
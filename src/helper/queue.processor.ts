import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { process } from 'src/process/sqlTables/process.table';
import { processInstance } from 'src/process/sqlTables/processInstance.table';
import { ProcessInstanceDetail } from 'src/process/sqlTables/processInstanceDetail.table';
import { task } from 'src/process/sqlTables/task.table';
import { Subscription } from 'src/subscription/sqlTable/subscription.table';
import { DataSource } from 'typeorm';

abstract class BaseProcessor<T> extends WorkerHost {
    constructor(protected readonly dataSource: DataSource) {
        super();
    }

    protected async handleJob(
        job: Job<any, any, string>,
        entity: new () => T,
        keyField: keyof T,
    ): Promise<void> {
        const data = job.data;
        try {
            delete data.__v;

            switch (job.name) {
                case 'insert':
                    delete data.__v;
                    await this.dataSource
                        .getRepository(entity)
                        .save(data);
                    break;

                case 'update':
                    delete data.__v;
                await this.dataSource
                    .createQueryBuilder()
                    .update(entity)
                    .set(data)
                    .where('_id = :_id', { _id: data._id.toString() })
                    .execute();
                    break;

                case 'delete':
                    await this.dataSource
                        .getRepository(entity)
                        .delete({ [keyField]: data } as any);
                    break;

                default:
                    console.warn(`Unknown job name: ${job.name}`);
            }
        } catch (error) {
            console.error(`Error processing ${job.name}:`, error);
        }
    }
}

@Processor('processInstance-events', {
    connection: { host: '127.0.0.1', port: 6379 },
})
export class processInstanceProcessor extends BaseProcessor<processInstance> {
    constructor(@InjectDataSource() dataSource: DataSource) {
        super(dataSource);
    }

    async process(job: Job<any, any, string>): Promise<any> {
        await this.handleJob(job, processInstance, '_id');
    }
}

@Processor('processInstanceDetail-events', {
    connection: { host: '127.0.0.1', port: 6379 },
})
export class processInstanceDetailProcessor extends BaseProcessor<ProcessInstanceDetail> {
    constructor(@InjectDataSource() dataSource: DataSource) {
        super(dataSource);
    }

    async process(job: Job<any, any, string>): Promise<any> {
        await this.handleJob(job, ProcessInstanceDetail, '_id');
    }
}

@Processor('task-events', {
    connection: { host: '127.0.0.1', port: 6379 },
})
export class taskProcessor extends BaseProcessor<task> {
    constructor(@InjectDataSource() dataSource: DataSource) {
        super(dataSource);
    }

    async process(job: Job<any, any, string>): Promise<any> {
        await this.handleJob(job, task, '_id');
    }
}

@Processor('process-events', {
    connection: { host: '127.0.0.1', port: 6379 },
})
export class processProcessor extends BaseProcessor<process> {
    constructor(@InjectDataSource() dataSource: DataSource) {
        super(dataSource);
    }

    async process(job: Job<any, any, string>): Promise<any> {
        await this.handleJob(job, process, '_id');
    }
}

@Processor('subscription-events', {
    connection: { host: '127.0.0.1', port: 6379 },
})
export class subscriptionProcessor extends BaseProcessor<Subscription> {
    constructor(@InjectDataSource() dataSource: DataSource) {
        super(dataSource);
    }

    async process(job: Job<any, any, string>): Promise<any> {
        await this.handleJob(job, Subscription, '_id');
    }
}
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn, ValueTransformer } from 'typeorm';
const jsonTransformer: ValueTransformer = {
    to: (value) => JSON.stringify(value),
    from: (value) => {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    },
};

@Entity('processInstanceDetail')
export class ProcessInstanceDetail {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    _id: string;

    @Column({ type: 'varchar', length: 64 })
    processInstanceId: string;

    @Column({ type: 'varchar', length: 64 })
    processId: string;

    @Column({ type: 'varchar', length: 64 })
    taskId: string;

    @Column({  type: 'varchar', nullable: true, transformer: jsonTransformer })
    taskResponse: any;

    @Column({ type: 'varchar', length: 32 })
    taskStatus: string;

    @Column({ type: 'datetime', nullable: true })
    triggeredAt: Date;

    @Column({ type: 'datetime', nullable: true })
    startedAt: Date;

    @Column({ type: 'datetime', nullable: true })
    endedAt: Date;

    @Column({ type: 'varchar', length: 16 })
    status: string;

    @Column({ type: 'varchar', length: 64 })
    createdBy: string;

    @Column({ type: 'varchar', length: 64 })
    updatedBy: string;

    @CreateDateColumn({ type: 'datetime' })
    created_at?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at?: Date;
}

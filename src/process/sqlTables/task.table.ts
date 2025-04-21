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
@Entity('task')
export class task {

    @PrimaryColumn({ type: 'varchar', length: 64 })
    _id: string;

    @Column({ type: 'varchar', length: 64 })
    processId: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    parentProcessId: string;

    @Column({ type: 'int' })
    taskNumber: number;

    @Column({ type: 'varchar', length: 32 })
    type: string;

    @Column({ type: 'bit', default: false })
    isLocked: boolean;

    @Column({ type: 'varchar', nullable: true, transformer: jsonTransformer })
    taskMetaData: any;

    @Column({ type: 'varchar', length: 16 })
    status: string;

    @CreateDateColumn({ type: 'datetime' })
    created_at?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at?: Date;
}

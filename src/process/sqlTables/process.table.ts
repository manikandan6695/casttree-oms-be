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
@Entity('process')
export class process {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    _id: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    parentProcessId: string;

    @Column({ type: 'varchar', nullable: true, transformer: jsonTransformer })
    processMetaData: any;

    @Column({ type: 'varchar', length: 16 ,nullable: true})
    status: string;

    @CreateDateColumn({ type: 'datetime' })
    created_at?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at?: Date;
}
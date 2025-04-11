import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
    ValueTransformer
} from 'typeorm';
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

@Entity('mandate')
export class Mandate {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    _id: string;


    @Column({ type: 'varchar', length: 36 })
    sourceId: string;

    @Column({ type: 'varchar', length: 36 })
    userId: string;

    @Column({ type: 'varchar', length: 32 })
    paymentMethod: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    upiVpa: string;

    @Column({ type: 'varchar', length: 32, nullable: true })
    bankAccountNumber: string;

    @Column({ type: 'varchar', length: 16, nullable: true })
    bankIFSC: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 8 })
    currency: string;

    @Column({ type: 'varchar', length: 32, nullable: true })
    frequency: string;

    @Column({ type: 'varchar', length: 32, nullable: true })
    mandateStatus: string;

    @Column({ type: 'varchar', length: 16, nullable: true })
    status: string;

    @Column({ type: 'text', nullable: true, transformer: jsonTransformer })
    metaData: any; 

    @Column({ type: 'datetime', nullable: true })
    startDate: Date;

    @Column({ type: 'datetime', nullable: true })
    endDate: Date;

    @Column({ type: 'datetime', nullable: true })
    cancelDate: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    cancelReason: string;

    @Column({ type: 'int', nullable: true })
    providerId: number;

    @Column({ type: 'varchar', length: 64, nullable: true })
    planId: string;

    @Column({ type: 'varchar', length: 36, nullable: true })
    createdBy: string;

    @Column({ type: 'varchar', length: 36, nullable: true })
    updatedBy: string;

    @CreateDateColumn({ type: 'datetime' })
    created_at: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at: Date;
}

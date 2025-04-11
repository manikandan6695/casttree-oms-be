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

@Entity('subscription')
export class Subscription {

    @PrimaryColumn({ type: 'varchar', length: 64 })
    _id: string;

    @Column({ type: 'varchar', length: 64 })
    userId: string;

    @Column({ type: 'varchar', length: 64, })
    planId: string;

    @Column({ type: 'int',nullable: true })
    totalCount: number;

    @Column({ type: 'datetime',nullable: true})
    currentStart: Date;

    @Column({ type: 'int',nullable: true })
    quantity: number;

    @Column({ type: 'datetime',nullable: true })
    currentEnd: Date;

    @Column({ type: 'datetime',nullable: true })
    startAt: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'int',nullable: true })
    providerId: number;

    @Column({ type: 'varchar', length: 64, nullable: true })
    scheduleChangeAt: string;

    @Column({ type: 'datetime', nullable: true })
    endAt: Date;

    @Column({ type: 'int', nullable: true })
    paidCount: number;

    @Column({ type: 'datetime', nullable: true })
    expireBy: Date;

    @Column({ type: 'text' ,nullable: true, transformer: jsonTransformer })
    notes: any;

    @Column({ type: 'varchar', length: 32, nullable: true })
    subscriptionStatus: string;

    @Column({ type: 'text', nullable: true, transformer: jsonTransformer })
    metaData: any;

    @Column({ type: 'varchar', length: 16, nullable: true })
    status: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    createdBy: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    updatedBy: string;

    @CreateDateColumn({ type: 'datetime' })
    created_at: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at: Date;
}

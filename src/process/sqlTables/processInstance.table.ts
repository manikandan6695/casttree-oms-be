import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('processInstance')
export class processInstance {

    @PrimaryColumn({ type: 'varchar', length: 64 })
    _id: string;

    @Column({ type: 'varchar', length: 36 })
    userId: string;

    @Column({ type: 'varchar', length: 64 })
    processId: string;

    @Column({ type: 'varchar', length: 32,nullable: true })
    processType: string;

    @Column({ type: 'datetime' })
    startedAt: Date;

    @Column({ type: 'varchar', length: 64 ,nullable: true})
    orderId: string;

    @Column({ type: 'varchar', length: 32 ,nullable: true })
    processStatus: string;

    @Column({ type: 'varchar', length: 128 })
    currentTask: string;

    @Column({ type: 'datetime', nullable: true })
    purchasedAt: Date;

    @Column({ type: 'datetime', nullable: true })
    validTill: Date;

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

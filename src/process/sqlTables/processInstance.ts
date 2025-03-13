import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('processInstance')
export class SqlProcessInstance {
   
    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    userId: string;

    @Column({ nullable: true })
    processId: string;

    @Column({ nullable: true })
    processType: string;

    @Column({ nullable: true })
    startedAt: any;

    @Column({ nullable: true })
    orderId: string;

    @Column({ nullable: true })
    processStatus: string;

    @Column({ nullable: true })
    progressPercentage: string;

    @Column({ nullable: true })
    currentTask: string;

    @Column({ nullable: true })
    purchasedAt: any;

    @Column({ nullable: true })
    validTill: any;

    @Column({ nullable: true })
    status: string;

    @Column({ nullable: true })
    createdBy: string;

    @Column({ nullable: true })
    updatedBy: string;


}
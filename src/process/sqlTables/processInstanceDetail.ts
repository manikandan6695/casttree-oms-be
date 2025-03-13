import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('processInstanceDetail')
export class SqlProcessInsatnceDetail {
   
    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    processInstanceId: string;

    @Column({ nullable: true })
    processId: string;

    @Column({ nullable: true })
    taskId: string;

    @Column({ nullable: true })
    taskResponse: string;

    @Column({ nullable: true })
    taskStatus: string;

    @Column({ nullable: true })
    triggeredAt: string;

    @Column({ nullable: true })
    startedAt: string;

    @Column({ nullable: true })
    endedAt: string;

    @Column({ nullable: true })
    status: string;

    @Column({ nullable: true })
    createdBy: string;

    @Column({ nullable: true })
    updatedBy: string;

}
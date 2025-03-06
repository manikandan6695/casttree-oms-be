import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('serviceRequest')
export class SqlServiceRequest {

    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    itemId?: string;

    @Column({ nullable: true })
    sourceId?: string;

    @Column({ nullable: true })
    sourceType: string;

    @Column({ nullable: true })
    requestedBy: string;

    @Column({ nullable: true })
    serviceDueDate: string;

    @Column({ nullable: true })
    requestStatus: string;

    @Column({ nullable: true })
    visibilityStatus: string;

    @Column({ nullable: true })
    requestedToUser: string;

    @Column({ nullable: true })
    requestedToOrg: string;

    @Column({ nullable: true })
    requestedByOrg: string;

    @Column({ nullable: true })
    type: string;

    @Column({ nullable: true })
    status: string;

    @Column({ nullable: true })
    created_at: string;

    @Column({ nullable: true })
    updated_at: string;


    
}

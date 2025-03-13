import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('serviceResponse')
export class SqlServiceResponse {

    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    itemId: string;

    @Column({ nullable: true })
    requestId: string;

    @Column({ nullable: true })
    overAllRatings: number;

    @Column({ nullable: true })
    feedbackStatus: string;

    @Column({ nullable: true })
    status: string;

    @Column({ nullable: true })
    createdBy: any;

    @Column({ nullable: true })
    updatedBy: any;


    
}

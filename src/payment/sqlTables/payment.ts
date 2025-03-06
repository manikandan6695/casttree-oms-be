import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('payment')
export class SqlPayment {
   
    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    user_id: string;

    @Column({ nullable: true })
    source_id: string;

    @Column({ nullable: true })
    source_type: string;

    @Column({ nullable: true })
    document_status: string;

    @Column({ nullable: true })
    transaction_type: string;

    @Column({ nullable: true })
    created_at: string;

    @Column({ nullable: true })
    updated_at: string;

    @Column({ nullable: true })
    amount: number;
    
    @Column({ nullable: true })
    status: string;
   
    @Column({ nullable: true })
    currencyCode: string;

    @Column({ nullable: true })
    currency: string;

}
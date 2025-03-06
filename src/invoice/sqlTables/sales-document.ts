import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('salesDocument')
export class SqlSalesDocument {

    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    sales_doc_id_prefix: string;

    @Column({ nullable: true })
    sales_document_number: string;

    @Column({ nullable: true })
    source_id?: string;

    @Column({ nullable: true })
    source_type?: string;

    @Column({ nullable: true })
    document_status: string;

    @Column({ nullable: true })
    document_number: string;

    @Column({ nullable: true })
    currencyCode: string;

    @Column({ nullable: true })
    sub_total: number;

    @Column({ nullable: true })
    grand_total: number;

    @Column({ nullable: true })
    discount_amount: number;

    @Column({ nullable: true })
    created_at: string;

    @Column({ nullable: true })
    updated_at: string;

}
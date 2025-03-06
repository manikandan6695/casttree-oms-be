import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('itemDocument')
export class SqlItemDocument {

    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    source_id?: string;

    @Column({ nullable: true })
    source_type?: string;

    @Column({ nullable: true })
    item_id: string;

    @Column({ nullable: true })
    amount: number;

    @Column({ nullable: true })
    created_at: string;

    @Column({ nullable: true })
    updated_at: string;

}


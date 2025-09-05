import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("sales_document")
export class SalesDocumentSyncEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  mongoId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  source_id: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  source_type: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  document_id: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  document_type_name: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  doc_id_gen_type: string;

  @Column({ type: "nvarchar", length: 20, nullable: true })
  sales_doc_id_prefix: string;

  @Column({ type: "int", nullable: true })
  sales_doc_id: number;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  sales_document_number: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  document_number: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  E_doc_id: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  document_status: string;

  @Column({ type: "int", nullable: true })
  item_count: number;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  currency: string;

  @Column({ type: "nvarchar", length: 10, nullable: true })
  currencyCode: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  sub_total: number;

  @Column({ type: "datetime", nullable: true })
  due_date: Date;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  due_status: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  discount_type: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  discount_level: string;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  discount: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  discount_amount: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  adjustments: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  grand_total: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  balance: number;

  @Column({ type: "nvarchar", length: 50, default: "Active" })
  status: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  refund: number;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  created_by: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  updated_by: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  branch: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  tax_treatment: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  acknowledgement_status: string;

  @Column({ type: "nvarchar", length: 200, nullable: true })
  acknowledgement_reason: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  acknowledged_date: string;

  @Column({ type: "boolean", default: false })
  is_viewed_by_recipient: boolean;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  recipient_viewed_on: string;

  @Column({ type: "boolean", default: false })
  is_email_dispatched: boolean;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  price_list_id: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  reference_number: string;

  @Column({ type: "datetime", nullable: true })
  sales_date: Date;

  @Column({ type: "datetime", nullable: true })
  sales_expiry_date: Date;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  sales_expected_ship_date: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  payment_terms: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  warehouse: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  sales_person: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  added_type: string;

  @Column({ type: "nvarchar", length: 200, nullable: true })
  added_type_description: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  shipping_charge: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

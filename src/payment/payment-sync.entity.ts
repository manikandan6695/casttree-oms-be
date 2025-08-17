import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("payment")
export class PaymentSyncEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  mongoId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  user_id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  source_id: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  source_type: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  document_status: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  transaction_type: string;

  @Column({ type: "datetime", nullable: true })
  payment_date: Date;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  tendered_amount: number;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  payment_order_id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  document_id: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  document_type_name: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  doc_id_gen_type: string;

  @Column({ type: "nvarchar", length: 20, nullable: true })
  payment_doc_id_prefix: string;

  @Column({ type: "int", nullable: true })
  payment_doc_id: number;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  payment_document_number: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  document_number: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  place_of_supply: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  source_of_supply: string;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  description_of_supply: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  amount: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  total_tax_amount: number;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  branch: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  unused_amount: number;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  type: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  bank_charges: number;

  @Column({ type: "boolean", default: false })
  is_tds_deducted: boolean;

  @Column({ type: "boolean", default: false })
  is_reverese_charge_applied: boolean;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  tds_tax_account: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  tax: string;

  @Column({ type: "nvarchar", length: 50, default: "Pending" })
  status: string;

  @Column({ type: "nvarchar", length: 1000, nullable: true })
  internal_notes: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  reference_number: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  payment_mode: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  account: string;

  @Column({ type: "nvarchar", length: 10, nullable: true })
  currencyCode: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  currency: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  created_by: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

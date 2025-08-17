import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("item")
export class ItemSyncEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  mongoId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  orgId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  platformItemId: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  item_type: string;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  itemName: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  item_sku: string;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  itemDescription: string;

  @Column({ type: "nvarchar", length: 1000, nullable: true })
  item_short_description: string;

  @Column({ type: "nvarchar", length: 1000, nullable: true })
  item_long_description: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  item_sub_type: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  parent_item_id: string;

  @Column({ type: "boolean", default: true })
  show_in_list: boolean;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  item_classification_type: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  item_base_unit_of_measurement: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  uom_id: string;

  @Column({ type: "boolean", default: false })
  is_sales_configure: boolean;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  itemCategory: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  itemSubCategory: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  itemGroupId: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  itemCommissionMarkupType: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  itemCommissionMarkup: number;

  @Column({ type: "boolean", default: false })
  isItemCommissionIncluded: boolean;

  @Column({ type: "boolean", default: false })
  item_returnable: boolean;

  @Column({ type: "int", nullable: true })
  reorder_point: number;

  @Column({ type: "int", nullable: true })
  stock_alert: number;

  @Column({ type: "nvarchar", length: 12, nullable: true })
  upc: string;

  @Column({ type: "nvarchar", length: 13, nullable: true })
  ean: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  mpn: string;

  @Column({ type: "nvarchar", length: 13, nullable: true })
  isbn: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  item_tax_preference: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  excemption_reason: string;

  @Column({ type: "boolean", default: false })
  track_inventory: boolean;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  item_inventory_account: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  item_manufacturer: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  item_brand: string;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  seo_url: string;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  seo_title: string;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  seo_description: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  preffered_vendors: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  data_create_mode: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  comparePrice: number;

  @Column({ type: "nvarchar", length: 50, default: "Active" })
  status: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  created_by: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  updated_by: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  E_material_code: string;

  @Column({ type: "json", nullable: true })
  media: any;

  @Column({ type: "json", nullable: true })
  geo: any;

  @Column({ type: "json", nullable: true })
  item_codes: any;

  @Column({ type: "json", nullable: true })
  itemStatusHistory: any;

  @Column({ type: "json", nullable: true })
  item_sales_info: any;

  @Column({ type: "json", nullable: true })
  item_purchase_info: any;

  @Column({ type: "json", nullable: true })
  item_sales_channel: any;

  @Column({ type: "json", nullable: true })
  item_dimensions: any;

  @Column({ type: "json", nullable: true })
  item_weight: any;

  @Column({ type: "json", nullable: true })
  item_taxes: any;

  @Column({ type: "json", nullable: true })
  characteristics: any;

  @Column({ type: "json", nullable: true })
  variant: any;

  @Column({ type: "json", nullable: true })
  stock_details: any;

  @Column({ type: "json", nullable: true })
  additionalDetail: any;

  @Column({ type: "json", nullable: true })
  itemCommissionMarkupCurrency: any;

  @Column({ type: "json", nullable: true })
  tags: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

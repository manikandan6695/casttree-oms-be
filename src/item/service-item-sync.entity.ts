import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("service_item")
export class ServiceItemSyncEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  mongoId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  itemId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  userId: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  respondTime: string;

  @Column({ type: "int", nullable: true })
  itemSold: number;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  type: string;

  @Column({ type: "int", nullable: true })
  priorityOrder: number;

  @Column({ type: "nvarchar", length: 50, default: "Active" })
  status: string;

  @Column({ type: "json", nullable: true })
  skill: any;

  @Column({ type: "json", nullable: true })
  language: any;

  @Column({ type: "json", nullable: true })
  expertise: any;

  @Column({ type: "json", nullable: true })
  tag: any;

  @Column({ type: "json", nullable: true })
  additionalDetails: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("subscription")
export class SubscriptionSyncEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  mongoId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  userId: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  planId: string;

  @Column({ type: "int", nullable: true })
  totalCount: number;

  @Column({ type: "datetime", nullable: true })
  currentStart: Date;

  @Column({ type: "int", nullable: true })
  quantity: number;

  @Column({ type: "datetime", nullable: true })
  currentEnd: Date;

  @Column({ type: "datetime", nullable: true })
  startAt: Date;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  scheduleChangeAt: string;

  @Column({ type: "datetime", nullable: true })
  endAt: Date;

  @Column({ type: "int", nullable: true })
  paidCount: number;

  @Column({ type: "datetime", nullable: true })
  expireBy: Date;

  @Column({ type: "json", nullable: true })
  notes: any;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  subscriptionStatus: string;

  @Column({ type: "json", nullable: true })
  metaData: any;

  @Column({ type: "nvarchar", length: 50, default: "Active" })
  status: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  createdBy: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

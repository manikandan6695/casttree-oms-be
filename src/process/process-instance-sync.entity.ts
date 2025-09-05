import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("process_instance")
export class ProcessInstanceSyncEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  mongoId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  userId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  processId: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  processType: string;

  @Column({ type: "datetime", nullable: true })
  startedAt: Date;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  orderId: string;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  processStatus: string;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  progressPercentage: number;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  currentTask: string;

  @Column({ type: "datetime", nullable: true })
  purchasedAt: Date;

  @Column({ type: "datetime", nullable: true })
  validTill: Date;

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

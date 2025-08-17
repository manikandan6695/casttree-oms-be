import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("process_instance_detail")
export class ProcessInstanceDetailSyncEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  mongoId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  processInstanceId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  processId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  taskId: string;

  @Column({ type: "json", nullable: true })
  taskResponse: any;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  taskStatus: string;

  @Column({ type: "datetime", nullable: true })
  triggeredAt: Date;

  @Column({ type: "datetime", nullable: true })
  startedAt: Date;

  @Column({ type: "datetime", nullable: true })
  endedAt: Date;

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

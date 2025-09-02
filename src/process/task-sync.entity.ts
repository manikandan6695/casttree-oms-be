import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("task")
export class TaskSyncEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  mongoId: string;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  title: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  processId: string;

  @Column({ type: "nvarchar", length: 24, nullable: true })
  parentProcessId: string;

  @Column({ type: "int", nullable: true })
  taskNumber: number;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  type: string;

  @Column({ type: "boolean", default: false })
  isLocked: boolean;

  @Column({ type: "json", nullable: true })
  taskMetaData: any;

  @Column({ type: "nvarchar", length: 50, default: "Active" })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

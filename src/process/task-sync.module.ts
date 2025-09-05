import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaskSyncService } from "./task-sync.service";
import { TaskSyncController } from "./task-sync.controller";
import { TaskSyncEntity } from "./task-sync.entity";
import { taskSchema } from "./schema/task.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "task", schema: taskSchema }
    ]),
    TypeOrmModule.forFeature([TaskSyncEntity])
  ],
  controllers: [TaskSyncController],
  providers: [TaskSyncService],
  exports: [TaskSyncService]
})
export class TaskSyncModule {}

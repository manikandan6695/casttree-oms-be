import { Controller, Get, Post, Query } from "@nestjs/common";
import { TaskSyncService } from "./task-sync.service";

@Controller("task-sync")
export class TaskSyncController {
  constructor(private readonly taskSyncService: TaskSyncService) {}

  @Get("status")
  async getSyncStatus() {
    return await this.taskSyncService.getSyncStatus();
  }

  @Post("sync-existing")
  async syncExistingTasks() {
    await this.taskSyncService.syncExistingTasks();
    return {
      message: "Sync of existing tasks initiated",
      timestamp: new Date()
    };
  }

  @Get("synced-tasks")
  async getSyncedTasks(
    @Query("skip") skip: number = 0,
    @Query("limit") limit: number = 10
  ) {
    return await this.taskSyncService.getSyncedTasks(skip, limit);
  }

  @Get("find-by-mongo-id")
  async findSyncedTaskByMongoId(@Query("mongoId") mongoId: string) {
    return await this.taskSyncService.findSyncedTaskByMongoId(mongoId);
  }

  @Get("find-by-process-id")
  async findSyncedTasksByProcessId(@Query("processId") processId: string) {
    return await this.taskSyncService.findSyncedTasksByProcessId(processId);
  }

  @Get("find-by-parent-process-id")
  async findSyncedTasksByParentProcessId(@Query("parentProcessId") parentProcessId: string) {
    return await this.taskSyncService.findSyncedTasksByParentProcessId(parentProcessId);
  }

  @Get("find-by-type")
  async findSyncedTasksByType(@Query("type") type: string) {
    return await this.taskSyncService.findSyncedTasksByType(type);
  }

  @Get("find-by-status")
  async findSyncedTasksByStatus(@Query("status") status: string) {
    return await this.taskSyncService.findSyncedTasksByStatus(status);
  }

  @Get("find-by-task-number")
  async findSyncedTasksByTaskNumber(@Query("taskNumber") taskNumber: number) {
    return await this.taskSyncService.findSyncedTasksByTaskNumber(taskNumber);
  }

  @Get("statistics")
  async getTaskStatistics() {
    return await this.taskSyncService.getTaskStatistics();
  }
}

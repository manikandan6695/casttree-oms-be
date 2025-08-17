import { Controller, Get, Post, Query } from "@nestjs/common";
import { ProcessInstanceDetailSyncService } from "./process-instance-detail-sync.service";

@Controller("process-instance-detail-sync")
export class ProcessInstanceDetailSyncController {
  constructor(private readonly processInstanceDetailSyncService: ProcessInstanceDetailSyncService) {}

  @Get("status")
  async getSyncStatus() {
    return await this.processInstanceDetailSyncService.getSyncStatus();
  }

  @Post("sync-existing")
  async syncExistingProcessInstanceDetails() {
    await this.processInstanceDetailSyncService.syncExistingProcessInstanceDetails();
    return {
      message: "Sync of existing process instance details initiated",
      timestamp: new Date()
    };
  }

  @Get("synced-details")
  async getSyncedProcessInstanceDetails(
    @Query("skip") skip: number = 0,
    @Query("limit") limit: number = 10
  ) {
    return await this.processInstanceDetailSyncService.getSyncedProcessInstanceDetails(skip, limit);
  }

  @Get("find-by-mongo-id")
  async findSyncedProcessInstanceDetailByMongoId(@Query("mongoId") mongoId: string) {
    return await this.processInstanceDetailSyncService.findSyncedProcessInstanceDetailByMongoId(mongoId);
  }

  @Get("find-by-process-instance-id")
  async findSyncedProcessInstanceDetailsByProcessInstanceId(@Query("processInstanceId") processInstanceId: string) {
    return await this.processInstanceDetailSyncService.findSyncedProcessInstanceDetailsByProcessInstanceId(processInstanceId);
  }

  @Get("find-by-process-id")
  async findSyncedProcessInstanceDetailsByProcessId(@Query("processId") processId: string) {
    return await this.processInstanceDetailSyncService.findSyncedProcessInstanceDetailsByProcessId(processId);
  }

  @Get("find-by-task-id")
  async findSyncedProcessInstanceDetailsByTaskId(@Query("taskId") taskId: string) {
    return await this.processInstanceDetailSyncService.findSyncedProcessInstanceDetailsByTaskId(taskId);
  }

  @Get("find-by-task-status")
  async findSyncedProcessInstanceDetailsByTaskStatus(@Query("taskStatus") taskStatus: string) {
    return await this.processInstanceDetailSyncService.findSyncedProcessInstanceDetailsByTaskStatus(taskStatus);
  }
}

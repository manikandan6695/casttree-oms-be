import { Controller, Get, Post, Query } from "@nestjs/common";
import { ProcessInstanceSyncService } from "./process-instance-sync.service";

@Controller("process-instance-sync")
export class ProcessInstanceSyncController {
  constructor(private readonly processInstanceSyncService: ProcessInstanceSyncService) {}

  @Get("status")
  async getSyncStatus() {
    return await this.processInstanceSyncService.getSyncStatus();
  }

  @Post("sync-existing")
  async syncExistingProcessInstances() {
    await this.processInstanceSyncService.syncExistingProcessInstances();
    return {
      message: "Sync of existing process instances initiated",
      timestamp: new Date()
    };
  }

  @Get("synced-instances")
  async getSyncedProcessInstances(
    @Query("skip") skip: number = 0,
    @Query("limit") limit: number = 10
  ) {
    return await this.processInstanceSyncService.getSyncedProcessInstances(skip, limit);
  }

  @Get("find-by-mongo-id")
  async findSyncedProcessInstanceByMongoId(@Query("mongoId") mongoId: string) {
    return await this.processInstanceSyncService.findSyncedProcessInstanceByMongoId(mongoId);
  }

  @Get("find-by-user-id")
  async findSyncedProcessInstancesByUserId(@Query("userId") userId: string) {
    return await this.processInstanceSyncService.findSyncedProcessInstancesByUserId(userId);
  }

  @Get("find-by-process-id")
  async findSyncedProcessInstancesByProcessId(@Query("processId") processId: string) {
    return await this.processInstanceSyncService.findSyncedProcessInstancesByProcessId(processId);
  }

  @Get("find-by-status")
  async findSyncedProcessInstancesByStatus(@Query("status") status: string) {
    return await this.processInstanceSyncService.findSyncedProcessInstancesByStatus(status);
  }
}

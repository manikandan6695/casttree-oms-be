import { Controller, Get, Post, Delete, Query, Param, HttpException, HttpStatus } from "@nestjs/common";
import { ProcessInstanceSyncService } from "./process-instance-sync.service";

@Controller("process-instance-sync")
export class ProcessInstanceSyncController {
  constructor(
    private readonly processInstanceSyncService: ProcessInstanceSyncService
  ) {}

  @Get("status")
  async getSyncStatus() {
    try {
      return await this.processInstanceSyncService.getSyncStatus();
    } catch (error) {
      throw new HttpException(
        `Error getting sync status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("pause")
  async pauseSync() {
    try {
      await this.processInstanceSyncService.pauseSync();
      return { message: "Sync paused successfully" };
    } catch (error) {
      throw new HttpException(
        `Error pausing sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("resume")
  async resumeSync() {
    try {
      await this.processInstanceSyncService.resumeSync();
      return { message: "Sync resumed successfully" };
    } catch (error) {
      throw new HttpException(
        `Error resuming sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("synced-process-instances")
  async getSyncedProcessInstances(
    @Query("skip") skip: string = "0",
    @Query("limit") limit: string = "10"
  ) {
    try {
      const skipNum = parseInt(skip, 10);
      const limitNum = parseInt(limit, 10);
      
      if (isNaN(skipNum) || isNaN(limitNum) || skipNum < 0 || limitNum < 1 || limitNum > 100) {
        throw new HttpException(
          "Invalid skip or limit parameters",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.processInstanceSyncService.getSyncedProcessInstances(skipNum, limitNum);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error getting synced process instances: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("statistics")
  async getProcessInstanceStatistics() {
    try {
      return await this.processInstanceSyncService.getProcessInstanceStatistics();
    } catch (error) {
      throw new HttpException(
        `Error getting process instance statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-mongo-id/:mongoId")
  async findSyncedProcessInstanceByMongoId(@Param("mongoId") mongoId: string) {
    try {
      if (!mongoId || mongoId.length !== 24) {
        throw new HttpException(
          "Invalid MongoDB ObjectId format",
          HttpStatus.BAD_REQUEST
        );
      }

      const processInstance = await this.processInstanceSyncService.findSyncedProcessInstanceByMongoId(mongoId);
      
      if (!processInstance) {
        throw new HttpException(
          "Process instance not found",
          HttpStatus.NOT_FOUND
        );
      }

      return processInstance;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding process instance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-user-id/:userId")
  async findSyncedProcessInstancesByUserId(@Param("userId") userId: string) {
    try {
      if (!userId || userId.length !== 24) {
        throw new HttpException(
          "Invalid MongoDB ObjectId format",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.processInstanceSyncService.findSyncedProcessInstancesByUserId(userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding process instances by user ID: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-process-id/:processId")
  async findSyncedProcessInstancesByProcessId(@Param("processId") processId: string) {
    try {
      if (!processId || processId.length !== 24) {
        throw new HttpException(
          "Invalid MongoDB ObjectId format",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.processInstanceSyncService.findSyncedProcessInstancesByProcessId(processId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding process instances by process ID: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-status/:status")
  async findSyncedProcessInstancesByStatus(@Param("status") status: string) {
    try {
      if (!status) {
        throw new HttpException(
          "Status is required",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.processInstanceSyncService.findSyncedProcessInstancesByStatus(status);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding process instances by status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-process-status/:processStatus")
  async findSyncedProcessInstancesByProcessStatus(@Param("processStatus") processStatus: string) {
    try {
      if (!processStatus) {
        throw new HttpException(
          "Process status is required",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.processInstanceSyncService.findSyncedProcessInstancesByProcessStatus(processStatus);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding process instances by process status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("find-by-order-id/:orderId")
  async findSyncedProcessInstancesByOrderId(@Param("orderId") orderId: string) {
    try {
      if (!orderId) {
        throw new HttpException(
          "Order ID is required",
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.processInstanceSyncService.findSyncedProcessInstancesByOrderId(orderId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error finding process instances by order ID: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("sync-existing")
  async syncExistingProcessInstances() {
    try {
      return await this.processInstanceSyncService.syncExistingProcessInstances();
    } catch (error) {
      throw new HttpException(
        `Error syncing existing process instances: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete("clear-queue")
  async clearQueue() {
    try {
      return await this.processInstanceSyncService.clearQueue();
    } catch (error) {
      throw new HttpException(
        `Error clearing queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { updateProcessInstanceDTO } from "./dto/process.dto";
import { ProcessService } from "./process.service";

@Controller("process")
export class ProcessController {
  constructor(private processsService: ProcessService) { }

  @UseGuards(JwtAuthGuard)
  @Get("taskDetails/:processId/task/:taskId")
  async getTaskDetail(
    @Param("processId") processId: string,
    @Param("taskId") taskId: string,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.processsService.getTaskDetail(
        processId,
        taskId,
        token
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch("updateProcessInstance")
  async updateProcessInstance(
    @Body(new ValidationPipe({ whitelist: true })) body: updateProcessInstanceDTO,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.processsService.updateProcessInstance(body, token);
      return data;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("user")
  async getMySeries(
    @GetToken() token: UserToken,
    @Query("processStatus") processStatus: string
  ) {
    try {
      let data = await this.processsService.getMySeries(
        token.id,
        processStatus
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("tasks/:processId")
  async getAllTasks(
    @GetToken() token: UserToken,
    @Param("processId") processId: string,
  ) {
    try {
      let data = await this.processsService.getAllTasks(processId, token);
      return data;
    } catch (err) {
      throw err;
    }
  }
}

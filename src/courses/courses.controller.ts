import { Body, Controller, Get, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserToken } from 'src/auth/dto/usertoken.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetToken } from 'src/shared/decorator/getuser.decorator';
import { CoursesService } from './courses.service';
import { processInstanceDTO } from './dto/course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) { }
  @UseGuards(JwtAuthGuard)
  @Get("process/:processId/task/:taskId")
  async getTaskDetail(
    @Param("processId") processId: string,
    @Param("taskId") taskId: string,
  ) {
    try {
      let data = await this.coursesService.getTaskDetail(processId, taskId);
      return data;
    } catch (err) {
      throw err
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("createProcessInstance")
  async createProcessInstance(
    @Body(new ValidationPipe({ whitelist: true })) body: processInstanceDTO,
    @GetToken() token: UserToken,
  ) {
    try {
      let data = await this.coursesService.createProcessInstance(body, token);
      return data;
    } catch (err) {
      throw err
    }
  }
}

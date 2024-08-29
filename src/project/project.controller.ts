import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { ProjectService } from "./project.service";
import { Response } from "express";
import { ProjectDTO } from "./dto/project.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "src/user/dto/usertoken.dto";

@Controller("project")
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("save-project")
  async saveProject(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: ProjectDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.projectService.saveProject(body, token);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("get-projects")
  async getProjects(
    @GetToken() token: UserToken,
    @Query("search") search: string,
    @Query("searchAcrossCrew") searchAcrossCrew: boolean,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Res() res: Response
  ) {
    try {
      let data = await this.projectService.getProjects(
        token,
        search,
        skip,
        limit,
        searchAcrossCrew
      );
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("get-project/:project_id")
  async getProject(
    @GetToken() token: UserToken,
    @Param("project_id") project_id: string,
    @Res() res: Response
  ) {
    try {
      let data = await this.projectService.getProject(project_id, token);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(":project_id/nomination")
  async getNominationListByProject(
    @GetToken() token: UserToken,
    @Req() req,
    @Param("project_id") project_id: string,
    @Res() res: Response
  ) {
    try {
      let data = await this.projectService.getNominationListByProject(
        project_id,
        token,
        req
      );
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":projectId")
  async deleteProject(
    @GetToken() token: UserToken,
    @Param("projectId") projectId: string,
    @Res() res: Response
  ) {
    try {
      let data = await this.projectService.deleteProject(projectId, token);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }
}

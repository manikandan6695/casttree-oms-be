import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { SharedService } from "src/shared/shared.service";
import { UserToken } from "src/user/dto/usertoken.dto";
import { ConnectionService } from "./connection.service";
import {
  ConnectionDTO,
  ConnectionRequestDTO,
  UpdateConnectionDTO,
} from "./dto/connectionRequest.dto";

@Controller("connection")
export class ConnectionController {
  constructor(
    private readonly connectionService: ConnectionService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createConnectionRequest(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: ConnectionRequestDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.connectionService.createConnectionRequest(
        body,
        token
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
  @Get()
  async getConnectionRequestList(
    @GetToken() token: UserToken,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Query("type") type: string,
    @Query("requestType") requestType: string,
    @Res() res: Response
  ) {
    try {
      let data = await this.connectionService.getConnectionRequestList(
        skip,
        limit,
        token,
        type,
        requestType
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
  @Get("connections")
  async getConnections(
    @GetToken() token: UserToken,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Query("type") type: string,
    @Query("requestedBy") requestedBy: string,
    @Query("receivedBy") receivedBy: string,
    @Res() res: Response
  ) {
    try {
      let data = await this.connectionService.getConnections(
        skip,
        limit,
        token,
        type,
        requestedBy,
        receivedBy
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
  @Patch()
  async updateConnectionRequest(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: UpdateConnectionDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.connectionService.updateConnectionRequest(
        body,
        token
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
  @Patch("remove/:connectionId")
  async updateConnection(
    @GetToken() token: UserToken,
    @Param("connectionId") connectionId: string,
    @Body(new ValidationPipe({ whitelist: true })) body: ConnectionDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.connectionService.updateConnection(
        connectionId,
        body.connectionStatus,
        token
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
}

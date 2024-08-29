import { UserDetailDTO } from "./dto/create-user-event.dto";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HttpService } from "@nestjs/axios";
import { SharedService } from "src/shared/shared.service";
import { UpdateContactDTO, UpdateUserDTO } from "./dto/update-user.dto";
import { UserToken } from "./dto/usertoken.dto";
import { OnEvent } from "@nestjs/event-emitter";
import { IUserModel } from "./schema/user.schema";
import { EVENT_PEER_TUBE_USER_CREATED, EVENT_UPDATE_ORGANIZATION } from "src/nominations/constants/constants";
import { IPeerTubeUserCreationEvent } from "src/nominations/events/user-creation.interface";
import { ECommandProcessingStatus } from "src/shared/enum/command-source.enum";
import { ConfigService } from "@nestjs/config";
import { CtApiService } from "src/ct-api/ct-api.service";

import { CreatePeerTubeUserDTO } from "./dto/create-peer-tube-user.dto";
import { AppException } from "src/shared/app-exception";
import { IOrganizationModel } from "src/organization/schema/organization.schema";
import { INominationsModel } from "src/nominations/schema/nominations.schema";

@Injectable()
export class UserService {
  constructor(
    @InjectModel("user")
    private readonly userModel: Model<IUserModel>,
    @InjectModel("organization")
    private readonly organizationModel: Model<IOrganizationModel>,
    @InjectModel("nominations")
    private readonly nominationModel: Model<INominationsModel>,
    private http_service: HttpService,
    private configService: ConfigService,
    private ctService: CtApiService,
    private shared_service: SharedService
  ) {}

  async getUser(token: UserToken) {
    try {
      let user = await this.userModel.findOne({ _id: token.id }).lean();

      return user;
    } catch (err) {
      throw err;
    }
  }
  async getUserById(id: string) {
    try {
      let user = await this.userModel
        .findOne({ _id: id })
        .populate("city")
        .populate("state")
        .lean();

      return user;
    } catch (err) {
      throw err;
    }
  }

  async getUsers(skip: number, limit: number) {
    try {
      let users = await this.userModel
        .find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("media.media_id")
        .lean();

      return users;
    } catch (err) {
      throw err;
    }
  }

  async updateUser(
    body: UpdateUserDTO,
    token: UserToken,
    organization_id: string
  ) {
    try {
      await this.userModel.updateOne({ _id: token.id }, body);
      let user = await this.userModel
        .findOne({ _id: token.id })
        .populate("city")
        .populate("state");
        
        await this.shared_service.trackAndEmitEvent(
          EVENT_UPDATE_ORGANIZATION,
          body,
          true,
          {
            userId: user._id.toString(),
            resourceUri: null,
            action: null,
          }
        );
      return { message: "Updated Successfully", user };
    } catch (err) {
      throw err;
    }
  }

  async updateUserDetails(body: UpdateContactDTO, token: UserToken) {
    try {
      await this.userModel.updateOne({ _id: token.id }, body);
      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }

  @OnEvent(EVENT_PEER_TUBE_USER_CREATED)
  async userCreation(
    userCreationPayload: IPeerTubeUserCreationEvent
  ): Promise<any> {
    try {
      console.log("userCreationPayload", userCreationPayload);

      await this.shared_service.updateEventProcessingStatus(
        userCreationPayload?.commandSource,
        ECommandProcessingStatus.InProgress
      );
      console.log("inside event user created");
      await this.createPeerTubeUser(
        userCreationPayload,
        userCreationPayload.token
      );
      console.log("created peer tube user");

      await this.shared_service.updateEventProcessingStatus(
        userCreationPayload?.commandSource,
        ECommandProcessingStatus.Complete
      );
    } catch (err) {
      console.error("err", err);
      await this.shared_service.updateEventProcessingStatus(
        userCreationPayload?.commandSource,
        ECommandProcessingStatus.Failed
      );
    }
  }

  async createPeerTubeUser(
    body: CreatePeerTubeUserDTO,
    token: UserToken,
    mode?: string
  ) {
    try {
      let tokenFV = {
        username: this.configService.get("PEERTUBE_USERNAME"),
        passwordType: this.configService.get("PEERTUBE_PASSWORD"),
      };
      let ptAdminToken = await this.ctService.peerTubeTokenGeneration(
        tokenFV,
        tokenFV.passwordType
      );
      let user = await this.userModel.findOne({ _id: token.id });
      let fv = {
        username: `user${body.phoneNumber.trim()}`,
        password: token.id.concat(user.created_at.getTime().toString()),
        email: `user${body.phoneNumber.trim()}@casttree.com`,
        videoQuota: -1,
        videoQuotaDaily: -1,
        channelName: `${body.phoneNumber}_user_default_channel`,
        role: 2,
        adminFlags: 1,
      };
      try {
        let data = await this.http_service
          .post(
            `${this.configService.get("PEERTUBE_BASE_URL")}/api/v1/users`,
            fv,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${ptAdminToken["access_token"]}`,
              },
            }
          )
          .toPromise();
        return data.data;
      } catch (err) {
        throw new AppException(err.response.statusText, err.response.status);
      }
    } catch (err) {
      if (mode === "APICall") throw err;
      console.log("Error caught in trace", err);
    }
  }

  async validateAndCreateUser(body: UserDetailDTO) {
    try {
      let user = await this.userModel.findOne({
        phoneNumber: body.phoneNumber,
      });
      let data;
      if (!user)
        data = await this.userModel.create({
          phoneCountryCode: body.phoneCountryCode,
          phoneNumber: body.phoneNumber,
          emailId: body.emailId,
          userName: body.userName,
          dateOfBirth: null,
        });
      let oldUser = await this.userModel.findOne({
        phoneNumber: body.phoneNumber,
      });
      await this.nominationModel.updateOne(
        { _id: body.nominationId },
        { $set: { userId: oldUser._id } }
      );
      return { message: "created successfully" };
    } catch (err) {
      throw err;
    }
  }
}

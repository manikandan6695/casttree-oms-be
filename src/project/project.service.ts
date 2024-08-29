import { IItemDocumentModel } from "./../invoice/schema/item-document.schema";
import { EStatus } from "src/shared/enum/privacy.enum";
import { UserToken } from "src/user/dto/usertoken.dto";
import {
  HttpStatus,
  forwardRef,
  Inject,
  Injectable,
  Req,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IProjectModel } from "./schema/project.schema";
import { IApplicationModel } from "src/application/schema/application.schema";
import { AppException } from "src/shared/app-exception";
import { ISalesDocumentModel } from "src/invoice/schema/sales-document.schema";
import { IPaymentModel } from "src/payment-request/schema/payment.schema";
import { NominationsService } from "src/nominations/nominations.service";
import { CtApiService } from "src/ct-api/ct-api.service";
import { IPeertubeRepository } from "src/peertube/interface/ipeertube.repository";
import { EInjectionToken } from "src/peertube/application/injection-token.enum";
import { IMediaModel } from "src/media/schema/media.schema";
import { EProjectMediaType } from "./interface/project-media-type.enum";

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel("project")
    private readonly projectModel: Model<IProjectModel>,
    @InjectModel("application")
    private readonly applicationModel: Model<IApplicationModel>,
    @InjectModel("salesDocument")
    private readonly salesDocumentModel: Model<ISalesDocumentModel>,
    @InjectModel("payment")
    private readonly paymentModel: Model<IPaymentModel>,
    @InjectModel("itemDocument")
    private readonly itemDocumentModel: Model<IItemDocumentModel>,
    @Inject(forwardRef(() => NominationsService))
    private nominationService: NominationsService,
    private ctService: CtApiService,
    @Inject(EInjectionToken.PEERTUBE_REPOSITORY)
    private readonly peertubeRepository: IPeertubeRepository
  ) {}

  async saveProject(body: any, token: UserToken) {
    try {
      let data;
      let project = [body];

      for (let i = 0; i < project.length; i++) {
        let curr_data = project[i];
        let fv = {
          ...curr_data,
          submittedBy: token.id,
          createdBy: token.id,
          updatedBy: token.id,
        };

        if (curr_data.project_id)
          data = await this.projectModel.updateOne(
            { _id: curr_data.project_id },
            { $set: fv }
          );
        else data = await this.projectModel.create(fv);
      }

      return data;
    } catch (err) {
      throw err;
    }
  }
  async getProject(project_id: string, token: UserToken) {
    try {
      let data = await this.projectModel
        .findOne({ _id: project_id })
        .populate("category")
        .populate("genre")
        .populate("language")
        .populate("media.media_id")
        .lean();

      for (let media of data.media) {
        if (media.type == EProjectMediaType.VideoDocument) {
          const mediaDetail = media.media_id as IMediaModel;
          try {
            const videoURL =
              await this.peertubeRepository.getVideoURLByEmbeddedURL(
                mediaDetail.location
              );
            media["peertubeVideoURL"] = videoURL;
          } catch (videoDetailError) {
            media["peertubeVideoURL"] = "";
          }
        }
      }
      return { data };
    } catch (err) {
      throw err;
    }
  }
  async getProjects(
    token: UserToken,
    search?: string,
    skip?: number,
    limit?: number,
    searchAcrossCrew?: boolean
  ) {
    try {
      let filter = { createdBy: token.id, status: EStatus.Active };
      if (search) {
        filter["title"] = search;
      }
      // if (searchAcrossCrew) {
      //   filter["crewMembers"] = { "crew.userId": token.id };
      // }
      let data = await this.projectModel
        .find(filter)
        .populate("category")
        .populate("genre")
        .populate("media.media_id")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
      return data;
    } catch (err) {
      throw err;
    }
  }
  async deleteProject(projectId: string, token: UserToken) {
    try {
      let project = await this.projectModel.findOne({ _id: projectId });
      if (project && project.documentStatus == "Draft") {
        let application = await this.applicationModel.findOne({
          projectId: projectId,
        });
        let invoice = await this.salesDocumentModel
          .find({
            source_id: application._id,
          })
          .distinct("_id");
        console.log("invoice is", invoice);

        await this.applicationModel.updateMany(
          { projectId: projectId },
          { $set: { status: EStatus.Inactive } }
        );
        await this.projectModel.updateMany(
          { _id: projectId },
          { $set: { status: EStatus.Inactive } }
        );
        await this.salesDocumentModel.updateMany(
          { source_id: application._id },
          { status: EStatus.Inactive }
        );
        await this.itemDocumentModel.updateMany(
          { source_id: { $in: invoice } },
          {
            status: EStatus.Inactive,
          }
        );
        await this.paymentModel.updateMany(
          { source_id: application._id },
          { status: EStatus.Inactive }
        );

        return { message: "Deleted Successfully" };
      } else {
        throw new AppException(
          "Can't delete the project",
          HttpStatus.NOT_ACCEPTABLE
        );
      }
    } catch (err) {
      throw err;
    }
  }

  async getNominationListByProject(
    project_id: string,
    token: UserToken,
    @Req() req
  ) {
    try {
      let nominations =
        await this.nominationService.getNominationByProject(project_id);

      for (const nomination of nominations) {
        const requestId = nomination?.requestId;
        if (!requestId) continue;

        const serviceRequestData =
          await this.ctService.getServiceRequestByNomination(requestId, req);
        if (!serviceRequestData) continue;

        const isCurrentUser =
          nomination.userId.toString() === token.id.toString();
        const isRequestUnlocked =
          serviceRequestData.visibilityStatus === "Unlocked";

        if (!isCurrentUser || !isRequestUnlocked) {
          delete serviceRequestData.serviceResponse;
        }

        nomination["serviceRequestData"] = serviceRequestData;
      }

      return nominations;
    } catch (err) {
      throw err;
    }
  }

  async updateProjectCrew(projectId, body) {
    try {
      console.log("inside update crew", projectId, body);

      await this.projectModel.updateOne(
        { _id: projectId },
        { $set: { members: body } }
      );
      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }
}

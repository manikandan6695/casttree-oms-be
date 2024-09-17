import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SharedService } from "src/shared/shared.service";
import { IEndorsementModel } from "./schema/endorsement.schema";

@Injectable()
export class EndorsementService {
  constructor(
    @InjectModel("endorsement")
    private readonly endorsementModel: Model<IEndorsementModel>,
    private shared_service: SharedService
  ) {}

  async addEndorsement(body, token) {
    try {
      for (let i = 0; i < body.length; i++) {
        let curr_data = body[i];

        let fv = {
          endorsedBy: token.id,
          description: curr_data.description,
          relationship: curr_data.relationship,
          endorsedTo: curr_data.endorsedTo,
        };

        await this.endorsementModel.create(fv);
      }

      return { message: "Created Successfully" };
    } catch (err) {
      throw err;
    }
  }

  async getEndorsement(id: string) {
    try {
      let data = await this.endorsementModel
        .find({ endorsedTo: id })
        .populate("relationship")
        .populate("endorsedTo")
        .populate("endorsedBy");
      return data;
    } catch (err) {
      throw err;
    }
  }
}

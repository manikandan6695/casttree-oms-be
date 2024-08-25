import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { ESourceType } from "src/service-request/enum/service-request.enum";
import { CommentsDTO } from "./dto/comments.dto";
import { ICommentModel } from "./schema/comment.schema";

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel("comments")
    private readonly commentModel: Model<ICommentModel>
  ) {}

  async saveComment(body: CommentsDTO, token: UserToken) {
    try {
      let fv = {
        commentDescription: body.commentDescription,
        updatedBy: token.id,
      };
      if (body.id) {
        await this.commentModel.updateOne({ _id: body.id }, { $set: fv });
      } else {
        fv["sourceId"] = body.sourceId;
        fv["sourceType"] = body.sourceType;
        fv["createdBy"] = token.id;
        await this.commentModel.create(fv);
      }

      return { message: "Saved Successfully" };
    } catch (err) {
      throw err;
    }
  }

  async getComments(
    sourceId: any,
    sourceType: ESourceType,
    skip: number,
    limit: number
  ) {
    try {
      let data = await this.commentModel
        .find({
          sourceId: sourceId,
          sourceType: sourceType,
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
      let count = await this.commentModel.countDocuments();
      return { data: data, count: count };
    } catch (err) {
      throw err;
    }
  }

  async removeComment(id: string, token: UserToken) {
    try {
      await this.commentModel.deleteOne({ _id: id });
      return { message: "Deleted Successfully" };
    } catch (err) {
      throw err;
    }
  }
}

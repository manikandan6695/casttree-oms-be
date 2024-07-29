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

  async addComment(body: CommentsDTO, token: UserToken) {
    try {
      let fv = {
        sourceId: body.sourceId,
        sourceType: body.sourceType,
        commentDescription: body.commentDescription,
        createdBy: token.id,
        updatedBy: token.id,
      };
      let createdComment = await this.commentModel.create(fv);

      return createdComment;
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

      return data;
    } catch (err) {
      throw err;
    }
  }
}

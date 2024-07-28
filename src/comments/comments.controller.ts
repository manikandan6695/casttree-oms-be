import { Controller } from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { CommentsService } from "./comments.service";

@Controller("comments")
export class CommentsController {
  constructor(
    private commentsService: CommentsService,
    private sservice: SharedService
  ) {}
}

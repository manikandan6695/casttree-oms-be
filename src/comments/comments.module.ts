import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { SharedModule } from "src/shared/shared.module";
import { HelperModule } from "src/helper/helper.module";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { CommentSchema } from "./schema/comment.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "comments", schema: CommentSchema }]),
    SharedModule,
    AuthModule,
    HttpModule,
  forwardRef(() => HelperModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}

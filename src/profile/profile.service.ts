import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ISystemConfigurationModel } from "src/configuration/schema/system-configuration.schema";
import { ConnectionService } from "src/connection/connection.service";
import { EndorsementService } from "src/endorsement/endorsement.service";
import { ProjectService } from "src/project/project.service";
import { AppException } from "src/shared/app-exception";
import { SharedService } from "src/shared/shared.service";
import { IUserModel } from "src/user/schema/user.schema";
import { IProfileModel } from "./schema/profile.schema";
const { ObjectId } = require("mongodb");
@Injectable()
export class ProfileService {
  constructor(
    @InjectModel("profile")
    private readonly profileModel: Model<IProfileModel>,
    @InjectModel("user")
    private readonly userModel: Model<IUserModel>,
    @InjectModel("system-config")
    private readonly system_config_model: Model<ISystemConfigurationModel>,
    private endorsementService: EndorsementService,
    private projectService: ProjectService,
    private connectionService: ConnectionService,
    private shared_service: SharedService
  ) {}

  async submitProfile(body, token) {
    try {
      let profile = await this.profileModel.findOne({ userId: token.id });
      if (profile) {
        throw new AppException(
          "Profile already exists",
          HttpStatus.NOT_ACCEPTABLE
        );
      }
      let fv = {
        ...body,
        createdBy: token.id,
        updatedBy: token.id,
      };
      await this.profileModel.create(fv);
      return { message: "Submitted Successfully" };
    } catch (err) {
      throw err;
    }
  }
  async getProfile(id, token) {
    try {
      let data = await this.profileModel
        .findOne({ _id: id })
        .populate("roles")
        .populate({
          path: "education",
          populate: [
            {
              path: "fieldOfStudy",
            },
            {
              path: "degree",
            },
            {
              path: "media.media_id",
              select: { location: 1, media_url: 1 },
            },
          ],
        })
        .populate({
          path: "workExperience.media.media_id",
          select: { location: 1, media_url: 1 },
        })
        .populate({
          path: "awards.media.media_id",
          select: { location: 1, media_url: 1 },
        })
        .populate("skills")
        .populate("documents.media_id")
        .populate({
          path: "workExperience",
          populate: [
            {
              path: "employmentType",
            },
            {
              path: "location",
            },
          ],
        })
        .populate({
          path: "language.languageId",
          populate: [
            {
              path: "media.mediaId",
              select: { location: 1 },
            },
          ],
        })
        .populate("media.media_id", "location file_name media_type media_url")
        .populate(
          "coverImage.media_id",
          "location file_name media_type media_url"
        )
        .populate({
          path: "userId",
          select: { userName: 1, city: 1, state: 1, gender: 1 },
          populate: [
            {
              path: "city",
              select: {
                city_name: 1,
              },
            },
            {
              path: "state",
              select: {
                state_name: 1,
              },
            },
          ],
        })
        .lean();
      if (data) {
        let endorsement = await this.endorsementService.getEndorsement(
          token.id
        );
        let connectionsCount =
          await this.connectionService.getConnectionCount(id);
        let connection = await this.connectionService.getConnectionStatusByIds(
          token.profileId,
          id
        );
        data["connectionStatus"] = connection.requestStatus;
        let project = await this.projectService.getProjects(token);
        data["followerCount"] = connectionsCount.followerCount;
        data["followingCount"] = connectionsCount.followingCount;
        data["endorsement"] = endorsement;
        data["project"] = project;
      }

      // let name = await this.generateUsername(data.userId["userName"]);

      return data;
    } catch (err) {
      throw err;
    }
  }

  async getProfileByUserId(userId: string) {
    try {
      let data = await this.profileModel
        .findOne({ userId: userId })
        .populate("roles")
        .populate({
          path: "education",
          populate: [
            {
              path: "fieldOfStudy",
            },
            {
              path: "degree",
            },
            {
              path: "media.media_id",
              select: { location: 1, media_url: 1 },
            },
          ],
        })
        .populate({
          path: "workExperience.media.media_id",
          select: { location: 1, media_url: 1 },
        })
        .populate({
          path: "awards.media.media_id",
          select: { location: 1, media_url: 1 },
        })
        .populate("skills")
        .populate("documents.media_id")
        .populate({
          path: "workExperience",
          populate: [
            {
              path: "employmentType",
            },
            {
              path: "location",
            },
          ],
        })
        .populate({
          path: "language.languageId",
          populate: [
            {
              path: "media.mediaId",
              select: { location: 1 },
            },
          ],
        })
        .populate("media.media_id", "location file_name media_type")
        .populate("coverImage.media_id", "location file_name media_type")
        .populate({
          path: "userId",
          select: { userName: 1, city: 1, state: 1, gender: 1 },
          populate: [
            {
              path: "city",
              select: {
                city_name: 1,
              },
            },
            {
              path: "state",
              select: {
                state_name: 1,
              },
            },
          ],
        })
        .lean();
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getSuggestions(body, token) {
    try {
      // console.log("id", token.id);

      let aggregation_pipeline = [];
      aggregation_pipeline.push({
        $match: { userId: { $ne: new ObjectId(token.id) } },
      });

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        {
          $unwind: { path: "$userId" },
        }
      );
      if (body.city) {
        aggregation_pipeline.push({
          $match: {
            "userId.city": new ObjectId(body.city),
          },
        });
      }

      if (body.skills) {
        let data = body.skills.map((e) => new ObjectId(e));
        aggregation_pipeline.push({
          $match: {
            skills: data,
          },
        });
      }

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "city",
            localField: "userId.city",
            foreignField: "_id",
            as: "userId.city",
          },
        },
        {
          $unwind: {
            path: "$userId.city",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "state",
            localField: "userId.state",
            foreignField: "_id",
            as: "userId.state",
          },
        },
        {
          $unwind: {
            path: "$userId.state",
            preserveNullAndEmptyArrays: true,
          },
        }
      );
      aggregation_pipeline.push(
        {
          $lookup: {
            from: "category",
            localField: "roles",
            foreignField: "_id",
            as: "roles",
          },
        },
        {
          $set: {
            roles: {
              $arrayElemAt: ["$roles", 0],
            },
          },
        }
        // {
        //   $unwind: {
        //     path: "$roles",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // }
      );

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "media",
            localField: "roles.media.media_id",
            foreignField: "_id",
            as: "roles.media.media_id",
          },
        },
        {
          $unwind: {
            path: "$roles.media.media_id",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "media",
            localField: "media.media_id",
            foreignField: "_id",
            as: "media.media_id",
          },
        },
        {
          $unwind: {
            path: "$media.media_id",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      aggregation_pipeline.push({
        $project: {
          userName: "$userId.userName",
          cityName: "$userId.city.city_name",
          cityId: "$userId.city._id",
          stateId: "$userId.state._id",
          stateName: "$userId.state.state_name",
          roleName: "$roles.category_name",
          roleMedia: "$roles.media.media_id.location",
          media: "$media.media_id.location",
          visibility: "$visibility",
        },
      });

      let countPipe = [...aggregation_pipeline];
      aggregation_pipeline.push(
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $skip: body.skip,
        },
        {
          $limit: body.limit,
        }
      );
      countPipe.push({
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      });

      let profileData = await this.profileModel.aggregate(aggregation_pipeline);
      let total_count = await this.profileModel.aggregate(countPipe);

      let count;
      if (total_count.length) {
        count = total_count[0].count;
      }
      if (profileData.length) {
        for (let i = 0; i < profileData.length; i++) {
          let curr_data = profileData[i];
          let connection =
            await this.connectionService.getConnectionStatusByIds(
              token.profileId,
              curr_data._id
            );
          curr_data["connectionStatus"] = connection.requestStatus;
        }
      }
      // console.log("profileData", JSON.stringify(profileData));

      return { profileData, count };
    } catch (err) {
      throw err;
    }
  }

  // async generateUsername(fullName) {
  //   const baseUsername = fullName.replace(/ /g, "_");
  //   let username = baseUsername;

  //   let count = 0;
  //   while (await this.userModel.findOne({ userName: username })) {
  //     count++;
  //     username = `${baseUsername}_${String(count).padStart(2, "0")}`;
  //   }

  //   return username;
  // }

  async updateProfile(id, body, token) {
    try {
      let systemConfig = await this.system_config_model.findOne({
        key: "default-image",
      });
      let user = await this.userModel.findOne({ _id: token.id });
      if (body.userName) {
        let data = await this.profileModel.findOne({
          userId: { $ne: token.id },
          userName: body.userName,
        });
        if (data) {
          throw new AppException(
            "Username already exists",
            HttpStatus.NOT_ACCEPTABLE
          );
        }
      }

      if (user.gender == "Male") {
        if (!body.media.length) {
          body["media"] = [
            {
              type: "display_picture",
              media_id: new ObjectId(systemConfig.value.Male),
            },
          ];
        }
      } else if (user.gender == "Female") {
        if (!body.media.length) {
          body["media"] = [
            {
              type: "display_picture",
              media_id: new ObjectId(systemConfig.value.Female),
            },
          ];
        }
      } else {
        if (!body.media.length) {
          body["media"] = [
            {
              type: "display_picture",
              media_id: new ObjectId(systemConfig.value.Others),
            },
          ];
        }
      }
      // await this.setDefaultMedia(body.gender, body.media);

      if (body.awards.length) {
        body.awards.forEach((e) => {
          e.media.push({
            type: "default_image",
            media_id: new ObjectId(systemConfig.value.Awards),
          });
        });
      }

      if (body.education.length) {
        body.education.forEach((e) => {
          e["media"] = [
            {
              type: "display_picture",
              media_id: new ObjectId(systemConfig.value.Education),
            },
          ];
        });
      }

      if (body.workExperience.length) {
        body.workExperience.forEach((e) => {
          e["media"] = [
            {
              type: "display_picture",
              media_id: new ObjectId(systemConfig.value.WorkExperience),
            },
          ];
        });
      }
      if (body.coverImage.length === 0) {
        body.coverImage.push({
          type: "display_picture",
          media_id: new ObjectId(systemConfig.value.CoverImage),
        });
      }
      // if (body.endorsement.length) {
      //   await this.endorsementService.addEndorsement(body.endorsement, token);
      // }
      // if (body.project.length) {
      //   await this.projectService.saveProject(body.project, token);
      // }

      await this.profileModel.updateOne({ _id: id }, { $set: body });
      let profile = await this.profileModel
        .findOne({ _id: id })
        .populate("roles")
        .populate({
          path: "education",
          populate: [
            {
              path: "fieldOfStudy",
            },
            {
              path: "degree",
            },
            {
              path: "media.media_id",
              select: { location: 1, media_url: 1 },
            },
          ],
        })
        .populate({
          path: "workExperience.media.media_id",
          select: { location: 1, media_url: 1 },
        })
        .populate({
          path: "awards.media.media_id",
          select: { location: 1, media_url: 1 },
        })
        .populate("skills")
        .populate("documents.media_id")
        .populate({
          path: "workExperience",
          populate: [
            {
              path: "employmentType",
            },
            {
              path: "location",
            },
          ],
        })
        .populate({
          path: "language.languageId",
          populate: [
            {
              path: "media.mediaId",
              select: { location: 1 },
            },
          ],
        })
        .populate("media.media_id", "location file_name media_type")
        .populate("coverImage.media_id", "location file_name media_type")
        .populate({
          path: "userId",
          select: { userName: 1, city: 1, state: 1, gender: 1 },
          populate: [
            {
              path: "city",
              select: {
                city_name: 1,
              },
            },
            {
              path: "state",
              select: {
                state_name: 1,
              },
            },
          ],
        });
      return { message: "Updated Successfully", profile };
    } catch (err) {
      throw err;
    }
  }

  async addDefaultMedia(array, defaultMediaId) {
    console.log("array is", array);

    array.forEach((item) => {
      console.log("item is", item);
      item.media.push({
        type: "display_picture",
        media_id: new ObjectId(defaultMediaId),
      });
    });

    return array;
  }
  async setDefaultMedia(gender, media) {
    if (!media.length) {
      media.push({
        type: "display_picture",
        media_id: new ObjectId(
          gender === "Male"
            ? "6681919249d9e2f2a88cc995"
            : "6681922849d9e2f2a88cc998"
        ),
      });
    }
    return media;
  }
  async getProfileList(body, token) {
    try {
      console.log("body is", body);

      let aggregation_pipeline = [];
      if (body.userIds.length) {
        let userIds = body.userIds.map((e) => new ObjectId(e));
        aggregation_pipeline.push({
          $match: { userId: { $in: userIds } },
        });
      }
      aggregation_pipeline.push(
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        {
          $unwind: { path: "$userId" },
        }
      );
      if (body.search) {
        let rex = new RegExp(body.search, "i");
        aggregation_pipeline.push({
          $match: { "userId.userName": rex },
        });
      }

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "city",
            localField: "userId.city",
            foreignField: "_id",
            as: "userId.city",
          },
        },
        {
          $unwind: {
            path: "$userId.city",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "state",
            localField: "userId.state",
            foreignField: "_id",
            as: "userId.state",
          },
        },
        {
          $unwind: {
            path: "$userId.state",
            preserveNullAndEmptyArrays: true,
          },
        }
      );
      aggregation_pipeline.push(
        {
          $lookup: {
            from: "category",
            localField: "roles",
            foreignField: "_id",
            as: "roles",
          },
        },
        {
          $set: {
            roles: {
              $arrayElemAt: ["$roles", 0],
            },
          },
        }
      );

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "media",
            localField: "roles.media.media_id",
            foreignField: "_id",
            as: "roles.media.media_id",
          },
        },
        {
          $unwind: {
            path: "$roles.media.media_id",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      aggregation_pipeline.push(
        {
          $lookup: {
            from: "media",
            localField: "media.media_id",
            foreignField: "_id",
            as: "media.media_id",
          },
        },
        {
          $unwind: {
            path: "$media.media_id",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      aggregation_pipeline.push({
        $project: {
          userName: "$userId.userName",
          userId: "$userId._id",
          cityName: "$userId.city.city_name",
          cityId: "$userId.city._id",
          stateId: "$userId.state._id",
          stateName: "$userId.state.state_name",
          roleName: "$roles.category_name",
          roleMedia: "$roles.media.media_id.location",
          media: "$media.media_id.location",
          visibility: "$visibility",
          profileId: "$_id",
        },
      });

      let countPipe = [...aggregation_pipeline];
      aggregation_pipeline.push({
        $sort: {
          _id: -1,
        },
      });
      countPipe.push({
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      });

      let profileData = await this.profileModel.aggregate(aggregation_pipeline);
      let total_count = await this.profileModel.aggregate(countPipe);

      let count;
      if (total_count.length) {
        count = total_count[0].count;
      }

      return { profileData, count };
    } catch (err) {
      throw err;
    }
  }
  async validateUserName(body, token) {
    try {
      // console.log("user id is", token.id);

      let data = await this.profileModel.findOne({
        userId: { $ne: token.id },
        userName: body.userName,
      });

      if (data) {
        throw new AppException(
          "Username already exists",
          HttpStatus.NOT_ACCEPTABLE
        );
      }

      return { message: "User name available" };
    } catch (err) {
      throw err;
    }
  }
}

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IAppNavBar } from "./schema/app-navbar.schema";
import { NavBarResponseDto } from "./dto/navbar-response.dto";
import { Status } from "./enums/status.enum";
import { IContentPage } from "./schema/page.schema";
import { IPageComponent } from "./schema/component.schema";

@Injectable()
export class FeedService {
  constructor(
    @InjectModel("appNavBar")
    private readonly appNavBarModel: Model<IAppNavBar>,
    @InjectModel("contentPage")
    private readonly contentPageModel: Model<IContentPage>,
    @InjectModel("pageComponent")
    private readonly pageComponentModel: Model<IPageComponent>
  ) {}

  async getNavBarDetails(userId: string): Promise<NavBarResponseDto> {
    try {
      const navBarDetails = await this.appNavBarModel.aggregate([
        {
          $match: {
            status: Status.ACTIVE,
          },
        },
        {
          $lookup: {
            from: "contentPages",
            localField: "tabs.pageId",
            foreignField: "_id",
            as: "pageDetails",
          },
        },
        {
          $addFields: {
            tabs: {
              $map: {
                input: "$tabs",
                as: "tab",
                in: {
                  $mergeObjects: [
                    "$$tab",
                    {
                      pageDetails: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$pageDetails",
                              as: "page",
                              cond: { $eq: ["$$page._id", "$$tab.pageId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            key: 1,
            position: 1,
            orientation: 1,
            tabs: {
              $map: {
                input: "$tabs",
                as: "tab",
                in: {
                  _id: "$$tab._id",
                  name: "$$tab.name",
                  icon: "$$tab.icon",
                  bgColorCode: "$$tab.bgColorCode",
                  bgImage: "$$tab.bgImage",
                  pageId: "$$tab.pageId",
                },
              },
            },
          },
        },
      ]);

      return {
        success: true,
        message: "Navigation bar details fetched successfully",
        data: navBarDetails[0],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Failed to fetch navigation bar details",
        error.message
      );
    }
  }

  async getPageDetails(pageId: string, userId: string) {
    try {
      const page = await this.contentPageModel
        .findOne({ _id: pageId, status: Status.ACTIVE })
        .lean();

      if (!page) {
        throw new NotFoundException("Page not found");
      }

      // Get all components for the page
      const components = await this.pageComponentModel
        .find({
          _id: { $in: page.components },
          status: Status.ACTIVE,
        })
        .sort({ order: 1 })
        .lean();

      // Map components to their respective positions in the page
      const populatedPage = {
        ...page,
        components: components.map((component) => ({
          _id: component._id,
          componentKey: component.componentKey,
          displayType: component.displayType,
          type: component.type,
          title: component.title,
          subtitle: component.subtitle,
          order: component.order,
          apiSpec: component.apiSpec,
          metaData: component.metaData,
          navigation: component.navigation,
          media: component.media,
        })),
      };

      return {
        success: true,
        message: "Page details fetched successfully",
        data: populatedPage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Failed to fetch page details",
        error.message
      );
    }
  }
}

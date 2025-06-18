import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IAppNavBar } from "./schema/app-navbar.schema";
import { NavBarResponseDto } from "./interface/dto/navbar-response.dto";
import { Status } from "./interface/enums/status.enum";
import { IContentPage } from "./schema/page.schema";
import { IComponent } from "./schema/component.schema";
import { PageResponseDto } from "./interface/dto/page-response.dto";
import { ComponentHandlerRegistry } from "./handlers/component-handler.registry";

@Injectable()
export class FeedService {
  constructor(
    @InjectModel("appNavBar")
    private readonly appNavBarModel: Model<IAppNavBar>,
    @InjectModel("contentPage")
    private readonly contentPageModel: Model<IContentPage>,
    @InjectModel("pageComponent")
    private readonly pageComponentModel: Model<IComponent>,
    private readonly componentHandlerRegistry: ComponentHandlerRegistry
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
      throw error;
    }
  }

  async getPageDetails(
    pageId: string,
    userId: string
  ): Promise<PageResponseDto> {
    try {
      const page = await this.contentPageModel
        .findOne({ _id: pageId, status: Status.ACTIVE })
        .lean();
      const components = await this.pageComponentModel
        .find({
          _id: { $in: page.components },
          status: Status.ACTIVE,
        })
        .sort({ order: 1 })
        .lean();

      const processedComponents = await Promise.all(
        components.map(async (component) => {
          const handler = this.componentHandlerRegistry.getHandler(
            component.componentKey
          );
          const processedComponent = await handler.handle(component, page);
          return {
            _id: component._id.toString(),
            componentKey: component.componentKey,
            ...processedComponent,
          };
        })
      );

      const populatedPage = {
        _id: page._id.toString(),
        pageName: page.pageName,
        key: page.key,
        components: processedComponents,
      };

      return {
        success: true,
        message: "Page details fetched successfully",
        data: populatedPage,
      };
    } catch (error) {
      throw error;
    }
  }
}

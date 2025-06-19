import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAppNavBar } from './interfaces/app-navbar.interface';
import { IContentPage } from './interfaces/content-page.interface';
import { IComponent } from './interfaces/component.interface';
import { Status } from './enums/status.enum';

@Injectable()
export class LearnHomeFeedRepository {
  constructor(
    @InjectModel('appNavBar')
    private readonly appNavBarModel: Model<IAppNavBar>,
    @InjectModel('contentPage')
    private readonly contentPageModel: Model<IContentPage>,
    @InjectModel('pageComponent')
    private readonly pageComponentModel: Model<IComponent>,
  ) {}

  async getNavBar(): Promise<any> {
    return this.appNavBarModel.aggregate([
      { $match: { status: Status.ACTIVE } },
      {
        $lookup: {
          from: 'contentPages',
          localField: 'tabs.pageId',
          foreignField: '_id',
          as: 'pageDetails',
        },
      },
      {
        $addFields: {
          tabs: {
            $map: {
              input: '$tabs',
              as: 'tab',
              in: {
                $mergeObjects: [
                  '$$tab',
                  {
                    pageDetails: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$pageDetails',
                            as: 'page',
                            cond: { $eq: ['$$page._id', '$$tab.pageId'] },
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
              input: '$tabs',
              as: 'tab',
              in: {
                _id: '$$tab._id',
                name: '$$tab.name',
                icon: '$$tab.icon',
                bgColorCode: '$$tab.bgColorCode',
                bgImage: '$$tab.bgImage',
                pageId: '$$tab.pageId',
              },
            },
          },
        },
      },
    ]);
  }

  async getContentPage(pageId: string): Promise<IContentPage | null> {
    return this.contentPageModel.findOne({ _id: pageId, status: Status.ACTIVE }).lean();
  }

  async getComponentsByIds(componentIds: string[]): Promise<IComponent[]> {
    return this.pageComponentModel
      .find({ _id: { $in: componentIds }, status: Status.ACTIVE })
      .sort({ order: 1 })
      .lean();
  }
}
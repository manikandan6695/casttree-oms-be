import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { EMixedPanelEvents } from "src/helper/enums/mixedPanel.enums";
import { HelperService } from "src/helper/helper.service";
import { EcomponentType, Eheader } from "src/item/enum/courses.enum";
import { Estatus } from "src/item/enum/status.enum";
import { ServiceItemService } from "src/item/service-item.service";
import { EPaymentSourceType } from "src/payment/enum/payment.enum";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { SubscriptionService } from "src/subscription/subscription.service";
import { EprocessStatus, EsubscriptionStatus, EtaskType } from "./enums/process.enum";
import { processInstanceModel } from "./schema/processInstance.schema";
import { processInstanceDetailModel } from "./schema/processInstanceDetails.schema";
import { taskModel } from "./schema/task.schema";


@Injectable()
export class ProcessService {
  constructor(
    @InjectModel("processInstance")
    private readonly processInstancesModel: Model<processInstanceModel>,
    @InjectModel("processInstanceDetail")
    private readonly processInstanceDetailsModel: Model<processInstanceDetailModel>,
    @InjectModel("task")
    private readonly tasksModel: Model<taskModel>,
    @Inject(forwardRef(() => ServiceItemService))
    private serviceItemService: ServiceItemService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentRequestService,
    private helperService: HelperService
  ) { }
  async getTaskDetail(processId, taskId, token) {
    try {
      // let subscription = await this.subscriptionService.validateSubscription(
      //   token.id
      // );
      // let payment = await this.paymentService.getPaymentDetailBySource(
      //   processId,
      //   token.id
      // );
      let serviceItemDetail: any = await this.serviceItemService.getServiceItemDetailbyProcessId(processId);
      let currentTaskData: any = await this.tasksModel.findOne({
        processId: processId,
        _id: taskId,
      });
      let finalResponse = {};
      let totalTasks = (
        await this.tasksModel.countDocuments({ processId: processId })
      ).toString();
      finalResponse["taskId"] = currentTaskData._id;
      finalResponse["parentProcessId"] = currentTaskData.parentProcessId;
      finalResponse["processId"] = currentTaskData.processId;
      finalResponse["taskType"] = currentTaskData.type;
      finalResponse["taskNumber"] = currentTaskData.taskNumber;
      finalResponse["taskTitle"] = currentTaskData.title;
      finalResponse["taskData"] = currentTaskData.taskMetaData;
      finalResponse["totalTasks"] = totalTasks;
      let nextTaskData = await this.tasksModel.findOne({
        taskNumber: currentTaskData.taskNumber + 1,
        processId: processId,
      });
      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.initiate_episode;
      mixPanelBody.distinctId = token.id;
      mixPanelBody.properties = { "itemname": serviceItemDetail.itemId.itemName, "task_name": currentTaskData.title, "task_number": currentTaskData.taskNumber };
      await this.helperService.mixPanel(mixPanelBody);
      let nextTask = {};
      if (nextTaskData) {
        //nextTaskData = await this.tasksModel.findOne({ processId: processId });
        nextTask = {
          taskId: nextTaskData._id,
          parentProcessId: nextTaskData.parentProcessId,
          processId: nextTaskData.processId,
          nextTaskTitle: nextTaskData.title,
          nextTaskType: nextTaskData.type,
          nextTaskThumbnail: await this.getThumbNail(
            nextTaskData?.taskMetaData?.media
          ),
          taskNumber: nextTaskData.taskNumber,
        };
      }

      let createProcessInstanceData;
      if (currentTaskData.type == EtaskType.Break) {
        createProcessInstanceData = await this.createProcessInstance(
          token.id,
          processId,
          taskId,
          currentTaskData.type,
          currentTaskData.taskMetaData.timeDurationInMin
        );
      } else {
        createProcessInstanceData = await this.createProcessInstance(
          token.id,
          processId,
          taskId,
          currentTaskData.type
        );
      }
      let subscription = await this.subscriptionService.validateSubscription(
        token.id,
        [EsubscriptionStatus.initiated, EsubscriptionStatus.expired]
      );
      let payment = await this.paymentService.getPaymentDetailBySource(
        createProcessInstanceData.instanceDetails._id,
        token.id
      );
      finalResponse["isLocked"] = (subscription || payment.paymentData.length)
        ? false
        : currentTaskData.isLocked;
      if (nextTaskData) {
        nextTask["isLocked"] =
          (subscription || payment.paymentData.length)
            ? false
            : nextTaskData.isLocked;
      }
      finalResponse["nextTaskData"] = nextTask;

      finalResponse["processInstanceDetails"] = createProcessInstanceData;

      return finalResponse;
    } catch (err) {
      throw err;
    }
  }
  async createProcessInstance(
    userId,
    processId,
    taskId,
    taskType,
    breakDuration?
  ) {
    try {
      let itemId =
        await this.serviceItemService.getServuceItemDetailsByProcessId(
          processId
        );
      let CurrentInstanceData;
      const currentTime = new Date();
      let currentTimeIso = currentTime.toISOString();
      let checkInstanceHistory: any = await this.processInstancesModel
        .findOne({
          userId: userId,
          processId: processId,
          status: Estatus.Active,
        })
        .lean();
      if (checkInstanceHistory) {
        checkInstanceHistory.itemId = itemId.itemId;
      }
      let finalResponse = {};
      if (!checkInstanceHistory) {
        let processInstanceBody = {
          userId: userId,
          processId: processId,
          processStatus: EprocessStatus.Started,
          currentTask: taskId,
          status: Estatus.Active,
          startedAt: currentTimeIso,
          createdBy: userId,
          updatedBy: userId,
        };
        let processInstanceData =
          await this.processInstancesModel.create(processInstanceBody);
        let updatedProcessInstanceData: any = processInstanceData;
        updatedProcessInstanceData.itemId = itemId.itemId;

        let processInstanceDetailBody = {
          processInstanceId: processInstanceData._id,
          processId: processId,
          taskId: taskId,
          taskStatus: EprocessStatus.Started,
          triggeredAt: currentTimeIso,
          startedAt: currentTimeIso,
          status: Estatus.Active,
          createdBy: userId,
          updatedBy: userId,
        };
        if (taskType == EtaskType.Break) {
          const newTime = new Date(
            currentTime.getTime() + parseInt(breakDuration) * 60000
          );
          const endAt = newTime.toISOString();
          processInstanceDetailBody["endedAt"] = endAt;
        }
        let processInstanceDetailData =
          await this.processInstanceDetailsModel.create(
            processInstanceDetailBody
          );

        finalResponse = {
          breakEndsAt: processInstanceDetailData.endedAt,
          instanceDetails: updatedProcessInstanceData,
        };
      } else {

        let checkTaskInstanceDetailHistory =
          await this.processInstanceDetailsModel.findOne({
            createdBy: userId,
            processId: processId,
            taskId: taskId,
          });
        if (checkTaskInstanceDetailHistory) {
          if (taskType == EtaskType.Break) {
            finalResponse = {
              breakEndsAt: checkTaskInstanceDetailHistory.endedAt,
              instanceDetails: checkInstanceHistory,
            };
          }
          finalResponse = {
            breakEndsAt: checkTaskInstanceDetailHistory.endedAt,
            instanceDetails: checkInstanceHistory,
          };
        } else {
          let updateProcessInstanceTask =
            await this.processInstancesModel.updateOne(
              { _id: checkInstanceHistory._id },
              { $set: { currentTask: taskId, updated_at: currentTimeIso } }
            );
          let processInstanceDetailBody = {
            processInstanceId: checkInstanceHistory._id,
            processId: processId,
            taskId: taskId,
            taskStatus: EprocessStatus.Started,
            triggeredAt: currentTimeIso,
            startedAt: currentTimeIso,
            status: Estatus.Active,
            createdBy: userId,
            updatedBy: userId,
          };
          if (taskType == EtaskType.Break) {
            const newTime = new Date(
              currentTime.getTime() + parseInt(breakDuration) * 60000
            );
            const endAt = newTime.toISOString();
            processInstanceDetailBody["endedAt"] = endAt;
          }
          let processInstanceDetailData =
            await this.processInstanceDetailsModel.create(
              processInstanceDetailBody
            );
        }
        if (taskType == EtaskType.Break) {
          CurrentInstanceData = await this.processInstanceDetailsModel.findOne({
            createdBy: userId,
            taskId: taskId,
          });
          finalResponse = {
            breakEndsAt: CurrentInstanceData.endedAt,
            instanceDetails: checkInstanceHistory,
          };
        } else {
          finalResponse = {
            instanceDetails: checkInstanceHistory,
          };
        }
      }
      return finalResponse;
    } catch (err) {
      throw err;
    }
  }

  async updateProcessInstance(body, token) {
    try {

      let isLastTask = false;
      let processInstanceBody = {};
      let processInstanceDetailBody = {};
      const currentTime = new Date();
      let currentTimeIso = currentTime.toISOString();
      if (body.processStatus) {
        processInstanceDetailBody["taskStatus"] = body.processStatus;
        if (body.taskType == EtaskType.Break) {
          const newTime = new Date(
            currentTime.getTime() + parseInt(body.timeDurationInMin) * 60000
          );
          const endAt = newTime.toISOString();
          processInstanceDetailBody["endedAt"] = endAt;
        }
        if (body.processStatus == EprocessStatus.Completed) {
          processInstanceDetailBody["taskResponse"] = body.taskResponse;
          processInstanceDetailBody["endedAt"] = currentTimeIso;
        }
      }
      let taskDetail = await this.tasksModel.findOne({
        _id: new ObjectId(body.taskId),
      });
      let totalTasks = await this.tasksModel.countDocuments({
        processId: taskDetail.processId,
      });
      let serviceItemDetail: any = await this.serviceItemService.getServiceItemDetailbyProcessId(taskDetail.processId);
      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.episode_complete;
      mixPanelBody.distinctId = token.id;
      mixPanelBody.properties = { "itemname": serviceItemDetail.itemId.itemName, "task_name": taskDetail.title, "task_number": taskDetail.taskNumber };
      await this.helperService.mixPanel(mixPanelBody);
      if (totalTasks == taskDetail.taskNumber) {

        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.series_complete;
        mixPanelBody.distinctId = token.id;
        mixPanelBody.properties = { "itemname": serviceItemDetail.itemId.itemName, "task_name": taskDetail.title, "task_number": taskDetail.taskNumber };
        await this.helperService.mixPanel(mixPanelBody);
        processInstanceBody["processStatus"] = EprocessStatus.Completed;
        let processInstanceData = await this.processInstancesModel.updateOne(
          {
            processId: taskDetail.processId,
            userId: new ObjectId(token.id),
          },
          { $set: processInstanceBody }
        );
      }

      let processInstanceDetailData =
        await this.processInstanceDetailsModel.updateOne(
          {
            taskId: new ObjectId(body.taskId),
            createdBy: new ObjectId(token.id),
            updated_at: currentTime,
          },
          { $set: processInstanceDetailBody }
        );
      let finalResponse = {
        message: "updated",
      };

      return finalResponse;
    } catch (err) {
      throw err;
    }
  }

  async pendingProcess(userId) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        userId,
        [EsubscriptionStatus.initiated, EsubscriptionStatus.expired]
      );
      let paidInstances = [];
      if (!subscription) {
        let payment = await this.paymentService.getPaymentDetailBySource(
          "",
          userId,
          EPaymentSourceType.processInstance
        );


        payment.paymentData.map((data) => {
          paidInstances.push(data.salesDocument.source_id.toString())
        })

      }


      const pendingTasks: any = await this.processInstancesModel
        .find({ userId: userId, processStatus: EprocessStatus.Started })
        .populate("currentTask")
        .sort({ updated_at: -1 })
        .lean();
      let userProcessInstances = [];
      for (let i = 0; i < pendingTasks.length; i++) {
        let totalTasks = await this.tasksModel.countDocuments({
          processId: pendingTasks[i].processId,
        });
        if (subscription) {
          pendingTasks[i].currentTask.isLocked = false;
        }
        if (paidInstances.length > 0) {
          if (paidInstances.includes(pendingTasks[i]._id.toString())) {
            pendingTasks[i].currentTask.isLocked = false;
          }
        }
        let completedTaskNumber = pendingTasks[i].currentTask.taskNumber - 1;
        pendingTasks[i].completed = Math.ceil(
          (completedTaskNumber / totalTasks) * 100
        );
        userProcessInstances.push(pendingTasks[i]._id);
      }


      return pendingTasks;
    } catch (err) {
      throw err;
    }
  }

  async getMySeries(userId, status) {
    try {
      const mySeries: any = await this.processInstancesModel
        .find({ userId: userId, processStatus: status })
        .populate("currentTask")
        .lean();
      for (let i = 0; i < mySeries.length; i++) {
        let totalTasks = await this.tasksModel.countDocuments({
          processId: mySeries[i].processId,
        });
        let completedTaskNumber =
          status == EprocessStatus.Completed
            ? mySeries[i].currentTask.taskNumber
            : mySeries[i].currentTask.taskNumber - 1;
        mySeries[i].progressPercentage = Math.ceil(
          (completedTaskNumber / totalTasks) * 100
        );

        if (status == EprocessStatus.Completed) {
          mySeries[i].completed = 100;
          let currentTask = await this.tasksModel.findOne({
            processId: mySeries[i].processId,
            taskNumber: 1,
          });
          mySeries[i].currentTask = currentTask;
        }
      }
      let processIds = [];
      for (let i = 0; i < mySeries.length; i++) {
        processIds.push(mySeries[i].processId);
      }
      let mentorDetails =
        await this.serviceItemService.getMentorUserIds(processIds);
      for (let i = 0; i < mySeries.length; i++) {
        mySeries[i]["mentorName"] = mentorDetails[i].displayName;
        mySeries[i]["mentorImage"] = mentorDetails[i].media;
        mySeries[i]["seriesName"] = mentorDetails[i].seriesName;
        mySeries[i]["seriesThumbNail"] = mentorDetails[i].seriesThumbNail;
      }
      return mySeries;
    } catch (err) {
      throw err;
    }
  }

  async getAllTasks(processId, token: UserToken) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        token.id,
        [EsubscriptionStatus.initiated, EsubscriptionStatus.expired]
      );
      let userProcessInstanceData: any = await this.processInstanceDetailsModel
        .find({ processId: processId, createdBy: token.id })
        .lean();

      let allTaskdata: any = await this.tasksModel
        .find({
          processId: processId,
        })
        .sort({ taskNumber: 1 })
        .lean();
      let createdInstanceTasks = [];
      for (let i = 0; i < userProcessInstanceData.length; i++) {
        createdInstanceTasks.push(userProcessInstanceData[i].taskId.toString());
        let payment = await this.paymentService.getPaymentDetailBySource(
          userProcessInstanceData[i].processInstanceId,
          token.id
        );

        if (subscription || payment?.paymentData?.length) {
          allTaskdata.forEach((task) => {
            task.isLocked = false;
          });
        }
      }

      allTaskdata.forEach((task) => {
        if (createdInstanceTasks.includes(task._id.toString())) {
          task.isCompleted = true;
        } else {
          task.isCompleted = false;
        }
      });

      return allTaskdata;
    } catch (err) {
      throw err;
    }
  }

  async getFirstTask(processIds, userId) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        userId,
        [EsubscriptionStatus.initiated, EsubscriptionStatus.expired]
      );
      let paidInstances = [];
      if (!subscription) {
        let payment = await this.paymentService.getPaymentDetailBySource(
          "",
          userId,
          EPaymentSourceType.processInstance
        );
        payment.paymentData.map((data) => {
          paidInstances.push(data.salesDocument.source_id.toString())
        })
      }
      let userProcessInstances = await this.processInstancesModel.find({ userId: userId });
      let sourceIds = [];
      userProcessInstances.map((data) => { sourceIds.push(data._id) });
      let processObjIds = processIds.map((e) => new ObjectId(e));
      let data: any = await this.tasksModel.aggregate([
        { $match: { processId: { $in: processObjIds } } },
        { $sort: { taskNumber: 1 } },
        {
          $group: {
            _id: "$processId",
            firstTask: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$firstTask" } },
      ]);
      let processInstanceData: any = await this.processInstancesModel
        .find({ userId: userId, processStatus: EprocessStatus.Started })
        .populate("currentTask").lean();
      let activeProcessIds = [];
      if (processInstanceData != undefined && processInstanceData.length > 0) {
        processInstanceData.map((a) => {
          activeProcessIds.push(a.processId.toString());
        });
      }
      const currentTaskObject = processInstanceData.reduce((a, c) => {
        if (subscription) {
          c.currentTask.isLocked = false;

        } if (paidInstances.length > 0) {
          if (paidInstances.includes(c._id.toString())) {
            c.currentTask.isLocked = false;
          }
        }
        a[c.processId] = c.currentTask;
        return a;
      }, {});
      for (let i = 0; i < data.length; i++) {
        if (activeProcessIds.includes(data[i].processId.toString())) {
          let processId = data[i].processId.toString();

          data[i] = currentTaskObject[processId];
        }
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getThumbNail(media) {
    let mediaUrl = "";
    media.forEach((mediaData) => {
      if (mediaData.type === "thumbNail") {
        mediaUrl = mediaData.mediaUrl;
      }
    });
    return mediaUrl;
  }

  async getHomeScreenData(userId) {
    try {
      let finalData =
        await this.serviceItemService.getProcessHomeSceenData(userId);
      let featureCarouselData = {
        ListData: [],
      };
      let updatedSeriesForYouData = {
        ListData: [],
      };
      let updatedUpcomingData = {
        ListData: [],
      };
      let processIds = [];
      finalData["SeriesForYou"].map((data) => processIds.push(data?.processId));
      finalData["featured"].map((data) => processIds.push(data?.processId));
      finalData["upcomingseries"].map((data) =>
        processIds.push(data?.processId)
      );
      let firstTasks = await this.getFirstTask(processIds, userId);
      const firstTaskObject = firstTasks.reduce((a, c) => {
        a[c.processId] = c;
        return a;
      }, {});
      finalData["featured"].map((data) => {
        featureCarouselData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          ctaName: data.ctaName,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      finalData["SeriesForYou"].map((data) => {
        updatedSeriesForYouData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      finalData["upcomingseries"].map((data) => {
        updatedUpcomingData["ListData"].push({
          processId: data.processId,
          thumbnail: data.thumbnail,
          taskDetail: firstTaskObject[data.processId],
        });
      });
      let sections = [];
      let pendingProcessInstanceData = await this.pendingProcess(userId);
      let continueWhereYouLeftData = {
        ListData: [],
      };
      if (pendingProcessInstanceData.length > 0) {
        let continueProcessIds = [];
        pendingProcessInstanceData.map((data) =>
          continueProcessIds.push(data?.processId)
        );
        let mentorUserIds =
          await this.serviceItemService.getMentorUserIds(continueProcessIds);
        for (let i = 0; i < pendingProcessInstanceData.length; i++) {
          continueWhereYouLeftData["ListData"].push({
            thumbnail: await this.getThumbNail(
              pendingProcessInstanceData[i].currentTask.taskMetaData?.media
            ),
            title: pendingProcessInstanceData[i].currentTask.taskTitle,
            ctaName: "Continue",
            progressPercentage: pendingProcessInstanceData[i].completed,
            navigationURL:
              "process/" +
              pendingProcessInstanceData[i].processId +
              "/task/" +
              pendingProcessInstanceData[i].currentTask._id,
            taskDetail: pendingProcessInstanceData[i].currentTask,
            mentorImage: mentorUserIds[i].media,
            mentorName: mentorUserIds[i].displayName,
            seriesTitle: mentorUserIds[i].seriesName,
            seriesThumbNail: mentorUserIds[i].seriesThumbNail,
          });
        }
      }
      sections.push({
        data: {
          headerName: Eheader.continue,
          listData: continueWhereYouLeftData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ActiveProcessList,
      }),
        sections.push({
          data: {
            listData: featureCarouselData["ListData"],
          },
          horizontalScroll: true,
          componentType: EcomponentType.feature,
        }),
        sections.push({
          data: {
            headerName: Eheader.mySeries,
            listData: updatedSeriesForYouData["ListData"],
          },
          horizontalScroll: false,
          componentType: EcomponentType.ColThumbnailList,
        });
      sections.push({
        data: {
          headerName: Eheader.upcoming,
          listData: updatedUpcomingData["ListData"],
        },
        horizontalScroll: true,
        componentType: EcomponentType.ColThumbnailList,
      });

      let data = {};
      data["sections"] = sections;

      let finalResponse = {
        status: 200,
        message: "success",
        data: data,
      };
      return finalResponse;
    } catch (err) {
      throw err;
    }
  }
}

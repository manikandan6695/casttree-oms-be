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
import {
  EprocessStatus,
  EsubscriptionStatus,
  EtaskType,
} from "./enums/process.enum";
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
    @Inject(forwardRef(() => PaymentRequestService))
    private paymentService: PaymentRequestService,
    @Inject(forwardRef(() => HelperService))
    private helperService: HelperService
  ) {}
  async getTaskDetail(processId, taskId, token) {
    try {
      let serviceItemDetail: any =
        await this.serviceItemService.getServiceItemDetailbyProcessId(
          processId
        );
      let currentTaskData: any = await this.tasksModel.findOne({
        processId: processId,
        _id: new ObjectId(taskId),
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
      finalResponse["expertId"] = serviceItemDetail?.userId;
      finalResponse["itemId"] = serviceItemDetail?.itemId?._id;
      finalResponse["isEnableExpertQueries"] =
        serviceItemDetail?.itemId?.additionalDetail?.isEnableExpertQueries;
      let nextTaskData = await this.tasksModel.findOne({
        taskNumber: currentTaskData.taskNumber + 1,
        processId: processId,
      });
      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.initiate_episode;
      mixPanelBody.distinctId = token.id;
      mixPanelBody.properties = {
        itemname: serviceItemDetail.itemId.itemName,
        task_name: currentTaskData.title,
        task_number: currentTaskData.taskNumber,
        isLocked: currentTaskData.isLocked,
      };
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
        [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.expired,
          EsubscriptionStatus.failed,
        ]
      );
      let payment = await this.paymentService.getPaymentDetailBySource(
        token.id,
        createProcessInstanceData.instanceDetails._id
      );
      finalResponse["isLocked"] =
        subscription || payment.paymentData.length
          ? false
          : currentTaskData.isLocked;
      if (nextTaskData) {
        nextTask["isLocked"] =
          subscription || payment.paymentData.length
            ? false
            : nextTaskData.isLocked;
      }
      let isSeriesCompleted = await this.getCompletedTask(processId, token.id)
      finalResponse["nextTaskData"] = nextTask;
      if (subscription) {
      finalResponse["isSeriesCompleted"] = isSeriesCompleted
      } else {
        finalResponse["isSeriesCompleted"] = false
      }
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
            taskId: new ObjectId(taskId),
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
            taskId: new ObjectId(taskId),
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
      let serviceItemDetail: any =
        await this.serviceItemService.getServiceItemDetailbyProcessId(
          taskDetail.processId
        );
      let processInstanceDetailData =
        await this.processInstanceDetailsModel.updateOne(
          {
            taskId: new ObjectId(body.taskId),
            createdBy: new ObjectId(token.id),
          },
          { $set: processInstanceDetailBody }
        );
        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.episode_complete;
        mixPanelBody.distinctId = token.id;
        mixPanelBody.properties = {
          itemname: serviceItemDetail.itemId.itemName,
          task_name: taskDetail.title,
          task_number: taskDetail.taskNumber,
          isLocked: taskDetail.isLocked,
          is_locked: taskDetail.isLocked,
        };
        await this.helperService.mixPanel(mixPanelBody);
        let completedTasksCount = await this.processInstanceDetailsModel.countDocuments({
          processId: taskDetail.processId,
          createdBy: token.id
        });
        if (serviceItemDetail?.itemId?.additionalDetail?.isViewAllEpisode === true){
          if (completedTasksCount === totalTasks) {
            processInstanceBody["processStatus"] = EprocessStatus.Completed;
            let processInstanceData = await this.processInstancesModel.updateOne(
              {
                processId: taskDetail.processId,
                userId: new ObjectId(token.id),
              },
              { $set: processInstanceBody }
            );
            let mixPanelBody: any = {};
            mixPanelBody.eventName = EMixedPanelEvents.series_complete;
            mixPanelBody.distinctId = token.id;
            mixPanelBody.properties = {
              itemname: serviceItemDetail.itemId.itemName,
              task_name: taskDetail.title,
              task_number: taskDetail.taskNumber,
              item_name: serviceItemDetail.itemId.itemName,
            };
            await this.helperService.mixPanel(mixPanelBody);
          }
        } else {
          if (totalTasks === completedTasksCount) {
            processInstanceBody["processStatus"] = EprocessStatus.Completed;
            let processInstanceData = await this.processInstancesModel.updateOne(
              {
                processId: taskDetail.processId,
                userId: new ObjectId(token.id),
              },
              { $set: processInstanceBody }
            );
            let mixPanelBody: any = {};
            mixPanelBody.eventName = EMixedPanelEvents.series_complete;
            mixPanelBody.distinctId = token.id;
            mixPanelBody.properties = {
              itemname: serviceItemDetail.itemId.itemName,
              task_name: taskDetail.title,
              task_number: taskDetail.taskNumber,
              item_name: serviceItemDetail.itemId.itemName,
            };
            await this.helperService.mixPanel(mixPanelBody);
          }
        }
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
        [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.expired,
          EsubscriptionStatus.failed,
        ]
      );
      let paidInstances = [];
      if (!subscription) {
        let payment = await this.paymentService.getPaymentDetailBySource(
          userId,
          null,
          EPaymentSourceType.processInstance
        );

        payment.paymentData.map((data) => {
          paidInstances.push(data.salesDocument.source_id.toString());
        });
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
        let userCompletedTaskNumber = await this.getCompletedProcessDetail(userId, pendingTasks[i].processId.toString());
        pendingTasks[i].completed = Math.ceil(
          (userCompletedTaskNumber.length / totalTasks) * 100
        );
        userProcessInstances.push(pendingTasks[i]._id);
      }

      return pendingTasks;
    } catch (err) {
      throw err;
    }
  }

  async allPendingProcess(userId: string, processIds: string[]) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        userId,
        [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.expired,
          EsubscriptionStatus.failed,
        ]
      );
      let paidInstances = [];
      if (!subscription) {
        let payment = await this.paymentService.getPaymentDetailBySource(
          userId,
          null,
          EPaymentSourceType.processInstance
        );

        payment.paymentData.map((data) => {
          paidInstances.push(data.salesDocument.source_id.toString());
        });
      }

      const pendingTasks: any = await this.processInstancesModel
        .find({
          userId: userId,
          processId: { $in: processIds },
          processStatus: EprocessStatus.Started,
        })
        .populate("currentTask")
        .sort({ updated_at: -1 })
        .limit(5)
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
        let userCompletedTaskNumber = await this.getCompletedProcessDetail(userId, pendingTasks[i].processId.toString());
        pendingTasks[i].completed = Math.ceil(
          (userCompletedTaskNumber.length / totalTasks) * 100
        );
        let itemDetail = await this.serviceItemService.getItemDetailFromProcessId(
          pendingTasks[i].processId.toString()
        );
        pendingTasks[i].currentTask.itemId = itemDetail?.data?.itemId || null;
        userProcessInstances.push(pendingTasks[i]._id);
      }

      return pendingTasks;
    } catch (err) {
      throw err;
    }
  }
  async getCompletedProcessDetail(userId:string, processId:string) {
    try {
      let processInstanceDetailData = await this.processInstanceDetailsModel.find({
        createdBy: new ObjectId(userId),
        processId: new ObjectId(processId),
        taskStatus: EprocessStatus.Completed,
        status: Estatus.Active,
      }).lean()
      return processInstanceDetailData
    } catch (error) {
      throw error
    }
  }

  async getMySeries(userId, status) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        userId,
        [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.expired,
          EsubscriptionStatus.failed,
        ]
      );
      let paidInstances = [];
      if (!subscription) {
        let payment = await this.paymentService.getPaymentDetailBySource(
          userId,
          null,
          EPaymentSourceType.processInstance
        );
        payment.paymentData.map((data) => {
          paidInstances.push(data.salesDocument.source_id.toString());
        });
      }
      const mySeries: any = await this.processInstancesModel
        .find({ userId: userId, processStatus: status })
        .populate("currentTask")
        .lean();
      for (let i = 0; i < mySeries.length; i++) {
        if (subscription) {
          mySeries[i].currentTask.isLocked = false;
        }
        if (paidInstances.length > 0) {
          if (paidInstances.includes(mySeries[i]._id.toString())) {
            mySeries[i].currentTask.isLocked = false;
          }
        }
        let totalTasks = await this.tasksModel.countDocuments({
          processId: mySeries[i].processId,
        });
        let completedTaskNumber =
          status == EprocessStatus.Completed
            ? mySeries[i].currentTask.taskNumber
            : mySeries[i].currentTask.taskNumber - 1;
        let userCompletedTaskNumber = await this.getCompletedProcessDetail(userId, mySeries[i].processId.toString());
        mySeries[i].progressPercentage = Math.ceil(
          (userCompletedTaskNumber.length / totalTasks) * 100
        );
        let itemDetail = await this.serviceItemService.getItemDetailFromProcessId(
          mySeries[i].processId.toString()
        );
        mySeries[i].currentTask.itemId = itemDetail?.data?.itemId || null;

        if (status == EprocessStatus.Completed) {
          mySeries[i].completed = 100;
          let currentTask:any = await this.tasksModel.findOne({
            processId: mySeries[i].processId,
            taskNumber: 1,
          }).lean();
          currentTask.itemId = itemDetail?.data?.itemId || null;
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

  async getAllTasks(processId, skip: number, limit: number, token: UserToken, apiVersion: string,) {
    try {
      if (apiVersion === "2") {
        let userProcessInstanceData: any = await this.processInstanceDetailsModel
          .find({ processId: processId, createdBy: token.id })
          .lean();
        let payment;
        let subscription = await this.subscriptionService.validateSubscription(
          token.id,
          [
            EsubscriptionStatus.initiated,
            EsubscriptionStatus.expired,
            EsubscriptionStatus.failed,
          ]
        );
        if (!subscription) {
          payment = await this.paymentService.getPaymentDetailBySource(
            token.id,
            userProcessInstanceData[0].processInstanceId
          );
        }
        let allTaskdata: any = await this.tasksModel
          .find({
            processId: processId,
          })
          .sort({ taskNumber: 1 })
          .skip(skip || 0)
          .limit(limit || 50)
          .lean();
        let createdInstanceTasks = [];
        userProcessInstanceData.map((data) => {
          createdInstanceTasks.push(data.taskId.toString());
        });
        let serviceItemDetail = await this.serviceItemService.getServiceItemDetailbyProcessId(
          processId
        );
        let userProcessInstance = await this.processInstanceDetailsModel
          .find({ processId: processId, createdBy: token.id, taskStatus: EprocessStatus.Completed })
          .lean();
        allTaskdata.forEach((task) => {
          if (subscription || payment.paymentData.length > 0) {
            task.isLocked = false;
          }
          if (userProcessInstance.some(data => data.taskId.toString() === task._id.toString())) {
            task.isCompleted = true;
          } else {
            task.isCompleted = false;
          }
          if (serviceItemDetail?.itemId?.additionalDetail?.isViewAllEpisode === true){
            if (subscription) {
              task.showAllEpisodes = true;
            }
            else if (task.isLocked === false) {
              task.showAllEpisodes = true;
            }
            else {
              task.showAllEpisodes = false;
            }
          }
          else {
            if (task.isLocked === false && createdInstanceTasks.includes(task._id.toString()) ) {
              task.showAllEpisodes = true;
            }
            else if (createdInstanceTasks.includes(task._id.toString()) && subscription) {
              task.showAllEpisodes = true;
            }
            else {
            task.showAllEpisodes = false;
            }
          }
        });
        let count = await this.tasksModel.countDocuments({
          processId: processId,
        });
        return { allTaskdata, count };
      }
      else {
        let userProcessInstanceData: any = await this.processInstanceDetailsModel
          .find({ processId: processId, createdBy: token.id })
          .lean();
        let payment;
        let subscription = await this.subscriptionService.validateSubscription(
          token.id,
          [
            EsubscriptionStatus.initiated,
            EsubscriptionStatus.expired,
            EsubscriptionStatus.failed,
          ]
        );
        if (!subscription) {
          payment = await this.paymentService.getPaymentDetailBySource(
            token.id,
            userProcessInstanceData[0].processInstanceId
          );
        }
        let allTaskdata: any = await this.tasksModel
          .find({
            processId: processId,
          })
          .sort({ taskNumber: 1 })
          .skip(skip || 0)
          .limit(limit || 50)
          .lean();
        let createdInstanceTasks = [];
        userProcessInstanceData.map((data) => {
          createdInstanceTasks.push(data.taskId.toString());
        });

        allTaskdata.forEach((task) => {
          if (subscription || payment.paymentData.length > 0) {
            task.isLocked = false;
          }
          if (createdInstanceTasks.includes(task._id.toString())) {
            task.isCompleted = true;
          } else {
            task.isCompleted = false;
          }
        });
        return allTaskdata
      }

    } catch (err) {
      throw err;
    }
  }

  async getFirstTask(processIds, userId) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        userId,
        [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.expired,
          EsubscriptionStatus.failed,
        ]
      );
      let paidInstances = [];
      if (!subscription) {
        let payment = await this.paymentService.getPaymentDetailBySource(
          userId,
          null,
          EPaymentSourceType.processInstance
        );
        payment.paymentData.map((data) => {
          paidInstances.push(data.salesDocument.source_id.toString());
        });
      }
      let userProcessInstances = await this.processInstancesModel.find({
        userId: userId,
      });
      let sourceIds = [];
      userProcessInstances.map((data) => {
        sourceIds.push(data._id);
      });
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
        .populate("currentTask")
        .lean();
      let activeProcessIds = [];
      if (processInstanceData != undefined && processInstanceData.length > 0) {
        processInstanceData.map((a) => {
          activeProcessIds.push(a.processId.toString());
        });
      }
      const currentTaskObject = processInstanceData.reduce((a, c) => {
        
        if (subscription) {
          c.currentTask.isLocked = false;
        }
        if (paidInstances.length > 0) {
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
    media?.forEach((mediaData) => {
      if (mediaData?.type === "thumbNail") {
        mediaUrl = mediaData?.mediaUrl;
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
  async getTaskDetailByTaskId(taskId) {
    try {
      console.log("taskId", taskId);
      let id = new ObjectId(taskId);
      let taskData = await this.tasksModel.findOne({ _id: id }).lean();
      return taskData;
    } catch (error) {
      throw error;
    }
  }

  async getFirstTaskByProcess(processId: string) {
    try {
      let data = await this.tasksModel.find({
        processId: processId,
        taskNumber: 1,
      });
      let serviceItemData = await this.serviceItemService.getServiceItemDetailByProcessId(processId);
      return { data, itemId: serviceItemData?.itemId };
    } catch (error) {
      throw error;
    }
  }
  async getCompletedTask(processId: string, userId: string) {
    try {
      let taskData = await this.tasksModel.find({
        processId: new ObjectId(processId),
        status: Estatus.Active,
      }).lean()
      let processInstanceDetailData = await this.processInstanceDetailsModel.find({
        createdBy: new ObjectId(userId),
        processId: new ObjectId(processId),
        taskStatus: EprocessStatus.Completed,
        status: Estatus.Active,
      }).lean()
      let isSeriesCompleted = processInstanceDetailData.length === taskData.length
      return isSeriesCompleted;
    } catch (error) {
      throw error;
    }
  }
}

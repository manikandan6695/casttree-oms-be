import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { EcomponentType, Eheader } from "src/item/enum/courses.enum";
import { Estatus } from "src/item/enum/status.enum";
import { ServiceItemService } from "src/item/service-item.service";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { SubscriptionService } from "src/subscription/subscription.service";
import { EprocessStatus, EtaskType } from "./enums/process.enum";
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
    private paymentService: PaymentRequestService
  ) { }
  async getTaskDetail(processId, taskId, token) {
    try {
      let subscription = await this.subscriptionService.validateSubscription(
        token.id
      );
      let payment = await this.paymentService.getPaymentDetailBySource(
        processId,
        token.id
      );
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
      finalResponse["isLocked"] = !(subscription || payment.paymentData.length)
        ? currentTaskData.isLocked
        : false;

      let nextTaskData = await this.tasksModel.findOne({
        taskNumber: (currentTaskData.taskNumber + 1),
        processId: processId,
      });
      let nextTask = {};
      if (nextTaskData) {
        //nextTaskData = await this.tasksModel.findOne({ processId: processId });
        nextTask = {
          taskId: nextTaskData._id,
          parentProcessId: nextTaskData.parentProcessId,
          processId: nextTaskData.processId,
          nextTaskTitle: nextTaskData.title,
          nextTaskType: nextTaskData.type,
          nextTaskThumbnail: await this.getThumbNail(nextTaskData?.taskMetaData?.media),
          taskNumber: nextTaskData.taskNumber,
        };
        nextTask["isLocked"] =
          subscription || payment.paymentData.length
            ? false
            : nextTaskData.isLocked;
      }

      finalResponse["nextTaskData"] = nextTask;
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
      let itemId = await this.serviceItemService.getServuceItemDetailsByProcessId(processId);
      let CurrentInstanceData;
      const currentTime = new Date();
      let currentTimeIso = currentTime.toISOString();
      let checkInstanceHistory :any = await this.processInstancesModel.findOne({
        userId: userId,
        processId: processId,
        status: Estatus.Active,
      }).lean();
      

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
        let processInstanceData: any =
          await this.processInstancesModel.create(processInstanceBody);


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
         let updatedProcessInstanceData : any = processInstanceData
         updatedProcessInstanceData.itemId = itemId?.itemId;
        finalResponse = {
          breakEndsAt: processInstanceDetailData.endedAt,
          instancedetails : updatedProcessInstanceData
        }
      } else {
        checkInstanceHistory.itemId = itemId?.itemId;
        let checkTaskInstanceDetailHistory = await this.processInstanceDetailsModel.findOne({
          createdBy: userId,
          processId: processId,
          taskId: taskId
        });
        if (checkTaskInstanceDetailHistory) {
          if (taskType == EtaskType.Break) {
            finalResponse = {
              breakEndsAt: checkTaskInstanceDetailHistory.endedAt,
              instanceDetails: checkInstanceHistory
            };
          }
          finalResponse = {
            breakEndsAt: checkTaskInstanceDetailHistory.endedAt,
            instanceDetails: checkInstanceHistory
          };

        } else {
          let updateProcessInstanceTask = await this.processInstancesModel.updateOne({ _id: checkInstanceHistory._id }, { $set: { currentTask: taskId } })
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
      let taskDetail = await this.tasksModel.findOne({ _id: new ObjectId(body.taskId) })
      let totalTasks = await this.tasksModel.countDocuments({ processId: taskDetail.processId });
      if (totalTasks == taskDetail.taskNumber) {
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
            updated_at: currentTime
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

      const pendingTasks: any = await this.processInstancesModel.find({ userId: userId, processStatus: EprocessStatus.Started }).populate("currentTask").sort({updated_at:-1}).lean();

      for (let i = 0; i < pendingTasks.length; i++) {
        let totalTasks = (
          await this.tasksModel.countDocuments({
            processId: pendingTasks[i].processId,
          }));
          let completedTaskNumber = pendingTasks[i].currentTask.taskNumber-1;
        pendingTasks[i].completed = Math.ceil(
          (completedTaskNumber /
            totalTasks) *
          100
        );
      }
      return pendingTasks;
    } catch (err) {
      throw err;
    }
  }

  async getMySeries(userId, status) {
    try {

      const mySeries: any = await this.processInstancesModel.find({ userId: userId, processStatus: status }).populate("currentTask").lean();
      for (let i = 0; i < mySeries.length; i++) {
        let totalTasks = (
          await this.tasksModel.countDocuments({
            processId: mySeries[i].processId,
          })
        );
        let completedTaskNumber = (status == EprocessStatus.Completed) ? mySeries[i].currentTask.taskNumber : (mySeries[i].currentTask.taskNumber-1);
        mySeries[i].progressPercentage = Math.ceil(
          (completedTaskNumber /
            totalTasks) *
          100
        );

        if (status == EprocessStatus.Completed) {
          mySeries[i].completed = 100;
          let currentTask = await this.tasksModel.findOne({ processId: mySeries[i].processId, taskNumber: 1 });
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
        token.id
      );
      let userProcessInstanceData: any = await this.processInstanceDetailsModel.find({ processId: processId, createdBy: token.id }).lean();

      let createdInstanceTasks = [];
      for (let i = 0; i < userProcessInstanceData.length; i++) {
        createdInstanceTasks.push(userProcessInstanceData[i].taskId.toString())
      }
      let payment = await this.paymentService.getPaymentDetailBySource(
        processId,
        token.id
      );
      let allTaskdata: any = await this.tasksModel.find({
        processId: processId,
      }).sort({ taskNumber: 1 }).lean();

      allTaskdata.forEach((task) => {
        if (createdInstanceTasks.includes(task._id.toString())) {
          task.isCompleted = true;
        } else {
          task.isCompleted = false;
        }
      });
      if (subscription || payment?.paymentData?.length) {
        allTaskdata.forEach((task) => {
          task.isLocked = false;
        });
      }

      return allTaskdata;
    } catch (err) {
      throw err;
    }
  }

  async getFirstTask(processIds) {
    try {
      let processObjIds = processIds.map((e) => new ObjectId(e));
      return this.tasksModel.aggregate([
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
      let finalData = await this.serviceItemService.getProcessHomeSceenData(userId);
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
      finalData["upcomingseries"].map((data) => processIds.push(data?.processId));
      let firstTasks = await this.getFirstTask(processIds);
      const firstTaskObject = firstTasks.reduce((a, c) => {
        a[c.processId] = c;
        return a;
      }, {});
      finalData["featured"].map((data) => {
        featureCarouselData["ListData"].push({
          "processId": data.processId,
          "thumbnail": data.thumbnail,
          "ctaName": data.ctaName,
          "taskDetail": firstTaskObject[data.processId]
        })
      });
      finalData["SeriesForYou"].map((data) => {
        updatedSeriesForYouData["ListData"].push({
          "processId": data.processId,
          "thumbnail": data.thumbnail,
          "taskDetail": firstTaskObject[data.processId]
        })
      });
      finalData["upcomingseries"].map((data) => {
        updatedUpcomingData["ListData"].push({
          "processId": data.processId,
          "thumbnail": data.thumbnail,
          "taskDetail": firstTaskObject[data.processId]
        })
      });
      let sections = [];
      let pendingProcessInstanceData = await this.pendingProcess(userId);
      let continueWhereYouLeftData = {
        ListData: [],
      };
      if (pendingProcessInstanceData.length > 0) {
        let continueProcessIds = [];
        pendingProcessInstanceData.map((data) => continueProcessIds.push(data?.processId));
        let mentorUserIds =
          await this.serviceItemService.getMentorUserIds(continueProcessIds);
        for (let i = 0; i < pendingProcessInstanceData.length; i++) {
          continueWhereYouLeftData["ListData"].push({
            "thumbnail": await this.getThumbNail(pendingProcessInstanceData[i].currentTask.taskMetaData?.media),
            "title": pendingProcessInstanceData[i].currentTask.taskTitle,
            "ctaName": "Continue",
            "progressPercentage": pendingProcessInstanceData[i].completed,
            "navigationURL": "process/" + pendingProcessInstanceData[i].processId + "/task/" + pendingProcessInstanceData[i].currentTask._id,
            "taskDetail": pendingProcessInstanceData[i].currentTask,
            "mentorImage": mentorUserIds[i].media,
            "mentorName": mentorUserIds[i].displayName,
            "seriesTitle": mentorUserIds[i].seriesName,
            "seriesThumbNail": mentorUserIds[i].seriesThumbNail
          });
        }
      }
      sections.push({
        data: {
          headerName: Eheader.continue,
          listData: continueWhereYouLeftData["ListData"],
        },
        "horizontalScroll": true,
        "componentType": EcomponentType.ActiveProcessList

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
